import {useContext, useEffect, useState} from "react";
import axios from "axios";
import {notifications} from "@mantine/notifications";
import {AuthContext} from "../context/AuthContext.tsx";
import {
    ActionIcon,
    Button,
    Card,
    Center,
    Group,
    ScrollArea,
    Stack,
    Switch,
    Text,
    Title,
    Tooltip
} from "@mantine/core";
import {AreaChart, BarChart, DonutChart} from "@mantine/charts";
import {DatePickerInput, DateValue} from "@mantine/dates";
import {IconPlus, IconX} from "@tabler/icons-react";
import {LOCAL_HOST_API_URL} from "../utility/AppConstants.tsx";

/**
 * Endpoints:
 *
 * General summary + Time period comparison
 * -Get SUM all
 * -Get SUM after date
 * -Get SUM before date
 * -Get SUM after AND before date
 *
 * >Potentially just merge this into 1 endpoint where you always import dates
 *
 * Area chart
 * -Get list of [x] days (set max? set min?)
 * -Get sums per day
 * >call GET SUM BEFORE DATE [x] times? (inefficient af)
 * ????
 *
 * ---Get SUM all [userId]---
 * >>Get all documents with [userId]
 * >DocumentDTO
 * *timeStamp
 * *amountSpent
 * *spendingCategories (*name)
 *
 * >>Get all spendingCategories with [userId] (needed?)
 * >SpendingCategoryDTO
 * *name
 *
 * >>Aggregate data based on SpendingCategory into 2 formats:
 * >format1 - split view (add amountSpent/categoriesAmount to every listed category in the document)
 * >format2 - combo view (add amountSpent to every listed category in the document)
 * data = [
 *   { name: 'USA', value: 400, color: 'indigo.6' },
 *   { name: 'India', value: 300, color: 'yellow.6' },
 *   { name: 'Japan', value: 100, color: 'teal.6' },
 *   { name: 'Other', value: 200, color: 'gray.6' },
 * ]
 */

/**
 * BarChart logic
 * series = week
 * datakey = category
 *
 *     <BarChart
 *       h={300}
 *       data={data}
 *       dataKey="category"
 *       series={[
 *         { name: 'Period1', color: 'violet.6' },
 *         { name: 'Period2', color: 'blue.6' },
 *       ]}
 *       tickLine="y"
 *     />
 *
 * Series
 * [
 *   { name: 'Period1', color: 'violet.6' },
 *   { name: 'Period2', color: 'blue.6' },
 * ]
 * Data
 * [
 *   { category: 'Groceries', Period1: 1200, Period2: 900 },
 *   { category: 'Electronics', Period1: 1900, Period2: 1200 },
 * ]
 *
 * Functionality:
 * Create > creates the data chart with only the "category" value in each record, creates an empty series array
 * Add > Adds a new record to the series array, adds new values to each category in the data
 * Modify > Change the values of a given series in each category
 * Delete > Remove a period from the series table, remove value of given period from each category
 */

interface DonutDataInterface {
    name: string;
    value: number;
    color: string;
}

interface BarSeriesInterface {
    name: string;
    color: string;
}

const CHART_COLORS = [
    '#339af0', // blue-5
    '#ff6b6b', // red-5
    '#51cf66', // green-5
    '#fcc419', // yellow-5
    '#9775fa', // violet-5
    '#20c997', // teal-5
    '#f783ac', // pink-5
    '#748ffc', // indigo-5
    '#63e6be', // cyan-5
    '#ffa94d', // orange-5
];

const SpendingSummary = () => {
    //Donut Charts
    const [donutSplitView, setDonutSplitView] = useState<boolean>(true);

    const [customDonutChartView, setCustomDonutChartView] = useState<boolean>(true);

    const [sevenDayDonutSplitView, setSevenDayDonutSplitView] = useState<DonutDataInterface[]>([]);
    const [sevenDayDonutComboView, setSevenDayDonutComboView] = useState<DonutDataInterface[]>([]);

    const [thirtyDayDonutSplitView, setThirtyDayDonutSplitView] = useState<DonutDataInterface[]>([]);
    const [thirtyDayDonutComboView, setThirtyDayDonutComboView] = useState<DonutDataInterface[]>([]);

    const [totalDonutSplitView, setTotalDonutSplitView] = useState<DonutDataInterface[]>([]);
    const [totalDonutComboView, setTotalDonutComboView] = useState<DonutDataInterface[]>([]);

    const [customDonutSplitView, setCustomDonutSplitView] = useState<DonutDataInterface[]>([]);
    const [customDonutComboView, setCustomDonutComboView] = useState<DonutDataInterface[]>([]);

    const [donutChartStartDate, setDonutChartStartDate] = useState<Date | null>(null);
    const [donutChartEndDate, setDonutChartEndDate] = useState<Date | null>(null);

    const [datePairs, setDatePairs] = useState<[Date|undefined, Date|undefined][]>([]);

    //Bar chart
    const [barSplitView, setBarSplitView] = useState<boolean>(true);

    const [barChartSplitData, setBarChartSplitData] = useState<any[]>([]);
    const [barChartComboData, setBarChartComboData] = useState<any[]>([]);
    const [barSeriesData, setBarSeriesData] = useState<BarSeriesInterface[]>([]);

    //Area chart
    const [areaChartData, setAreaChartData] = useState<any[]>([]);
    const [areaChartMode, setAreaChartMode] = useState<boolean>(true);

    /**
     * We're not using the variable periodIndex, so TypeScript threw an error/warning
     * Turns out we can just remove periodIndex like so:
     * [periodIndex, setPeriodIndex] => [, setPeriodIndex]
     * and everything still works perfectly
     * remember to leave the comma
     */
    const [, setPeriodIndex] = useState<number>(1);

    const [responseData, setResponseData] = useState(null);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        fetchSpendingSummaryData().catch((error) => console.error("Error while fetching the spendingSummary data:", error));
    }, []);

    useEffect(() => {
        if(responseData) {
            const sevenDaysAgo = new Date();
            const fourteenDaysAgo = new Date();
            const thirtyDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            //Donut charts
            setSevenDayDonutSplitView(aggregateDonutData(responseData, sevenDaysAgo)[0]);
            setSevenDayDonutComboView(aggregateDonutData(responseData, sevenDaysAgo)[1]);

            setThirtyDayDonutSplitView(aggregateDonutData(responseData, thirtyDaysAgo)[0]);
            setThirtyDayDonutComboView(aggregateDonutData(responseData, thirtyDaysAgo)[1]);

            setTotalDonutSplitView(aggregateDonutData(responseData)[0]);
            setTotalDonutComboView(aggregateDonutData(responseData)[1]);

            //Bar chart
            // Reset bar chart data and state before creating new bars
            setBarChartSplitData([]);
            setBarChartComboData([]);
            setBarSeriesData([]);
            setDatePairs([]);
            setPeriodIndex(1); // Reset period index to 1
            
            createEmptyBarData(responseData);
            //Add this week and past week data as default values
            addBarData(responseData, sevenDaysAgo, new Date());
            addBarData(responseData, fourteenDaysAgo, sevenDaysAgo);

            //Area chart
            setAreaChartData(processAreaChartData(responseData));
        }
    }, [responseData]);

    useEffect(() => {
        //Custom date filter
        if (donutChartStartDate && donutChartEndDate && responseData) {
            setCustomDonutSplitView(aggregateDonutData(responseData, donutChartStartDate, donutChartEndDate)[0]);
            setCustomDonutComboView(aggregateDonutData(responseData, donutChartStartDate, donutChartEndDate)[1]);
        }
    }, [responseData, donutChartStartDate, donutChartEndDate]);

    // Handle date selection
    const handleApplyDateRange = () => {
        if (responseData && donutChartStartDate && donutChartEndDate) {
            setCustomDonutSplitView(aggregateDonutData(responseData, donutChartStartDate, donutChartEndDate)[0]);
            setCustomDonutComboView(aggregateDonutData(responseData, donutChartStartDate, donutChartEndDate)[1]);
            setCustomDonutChartView(!customDonutChartView);
        }
    };

    const fetchSpendingSummaryData = async () => {
        if (!user) return;

        try {
            const response = await axios.get(`${LOCAL_HOST_API_URL}/Users/${user.id}/spendingSummary`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            setResponseData(response.data);
        } catch (err) {
            console.error('Error fetching spendingSummary data:', err);
            notifications.show({
                message: 'Error during fetch',
                color: "red",
            });
        }
    };

    const aggregateData = (data: any, startDate?: Date, endDate?: Date): [Record<string, number>, Record<string, number>] => {
        const splitViewMap: Record<string, number> = {};
        const comboViewMap: Record<string, number> = {};

        data.spendingCategories.forEach((category: {name: string}) => {
            splitViewMap[category.name] = 0;
            comboViewMap[category.name] = 0;
        });

        data.documents.forEach((document: {
            timestamp: string;
            amountSpent: number;
            spendingCategories: {name: string}[];
        }) => {
            const documentDate = new Date(document.timestamp);

            const isAfterStart = !startDate || documentDate >= startDate;
            const isBeforeEnd = !endDate || documentDate <= endDate;

            if (isAfterStart && isBeforeEnd) {
                const amount = document.amountSpent;
                const categoryCount = document.spendingCategories.length;

                const splitAmount = amount/categoryCount;

                document.spendingCategories.forEach((category) => {
                    splitViewMap[category.name] = splitViewMap[category.name] + splitAmount;
                    comboViewMap[category.name] = comboViewMap[category.name] + amount;
                });
            }
        });

        return [splitViewMap, comboViewMap];
    };

    const aggregateDonutData = (data: any, startDate?: Date, endDate?: Date): [DonutDataInterface[], DonutDataInterface[]] => {
        if(!data) {
            return [[],[]]
        }

        const [splitViewMap, comboViewMap] = aggregateData(data, startDate, endDate);

        const splitViewData: DonutDataInterface[] = Object.entries(splitViewMap)
            .map(([category, amountSpent], index) => ({
            name: category,
            value: parseFloat(amountSpent.toFixed(2)),
            color: CHART_COLORS[index % CHART_COLORS.length],
            }))
            .filter(item => item.value > 0);
        const comboViewData: DonutDataInterface[] = Object.entries(comboViewMap).map(([category, amountSpent], index) => ({
            name: category,
            value: parseFloat(amountSpent.toFixed(2)),
            color: CHART_COLORS[index % CHART_COLORS.length],
            }))
            .filter(item => item.value > 0);

        return [splitViewData, comboViewData];
    }

    const createEmptyBarData = (data: any) => {
        if(!data)
            return [];

        const emptyBarData = data.spendingCategories.map((category: { name: string }) => ({
            category: category.name  // Just create objects with category property
        }));

        setBarChartSplitData(emptyBarData);
        setBarChartComboData(emptyBarData);
    };

    const addBarData = (data: any, startDate?: Date, endDate?: Date) => {
        if(!data) return [];

        setPeriodIndex(prevIndex => {
            const currentIndex = prevIndex;
            let periodName = "";
            
            if (currentIndex === 1) {
                periodName = "This Week";
            } else if (currentIndex === 2) {
                periodName = "Last Week";
            } else {
                periodName = "Custom Period " + (currentIndex - 2);
            }
            
            //This solution will cause color duplication, but an appropriate solution would be too complicated to bother with
            const periodColor = CHART_COLORS[currentIndex % CHART_COLORS.length];

            setDatePairs(prevPairs =>
                prevPairs ? [...prevPairs, [startDate, endDate]] : [[startDate, endDate]]
            );

            setBarSeriesData(prevSeries => [
                ...prevSeries,
                { name: periodName, color: periodColor }
            ]);

            const [splitViewMap, comboViewMap] = aggregateData(data, startDate, endDate);

            setBarChartSplitData(prevData =>
                prevData.map(item => ({
                    ...item,
                    [periodName]: parseFloat(splitViewMap[item.category].toFixed(2))
                }))
            );

            setBarChartComboData(prevData =>
                prevData.map(item => ({
                    ...item,
                    [periodName]: parseFloat(comboViewMap[item.category].toFixed(2))
                }))
            );

            return currentIndex + 1;
        });
    };

    const updateDatePairStart = (index: number, date: DateValue) => {
        setDatePairs(prev => {
            if(!prev || !date) return prev;
            const newPairs = [...prev];
            newPairs[index] = [date, newPairs[index][1]];

            const [splitViewMap, comboViewMap] = aggregateData(responseData, newPairs[index][0], newPairs[index][1]);
            const periodName = barSeriesData[index].name;

            setBarChartSplitData(prevData =>
                prevData.map(item => {
                    const newItem = {...item};
                    newItem[periodName] = splitViewMap[item.category].toFixed(2);
                    return newItem;
                })
            );

            setBarChartComboData(prevData =>
                prevData.map(item => {
                    const newItem = {...item};
                    newItem[periodName] = comboViewMap[item.category].toFixed(2);
                    return newItem;
                })
            );

           return newPairs;
        });


    };

    const updateDatePairEnd = (index: number, date: DateValue) => {
        setDatePairs(prev => {
            if(!prev || !date) return prev;
            const newPairs = [...prev];
            newPairs[index] = [newPairs[index][0], date];

            const [splitViewMap, comboViewMap] = aggregateData(responseData, newPairs[index][0], newPairs[index][1]);
            const periodName = barSeriesData[index].name;

            setBarChartSplitData(prevData =>
                prevData.map(item => {
                    const newItem = {...item};
                    newItem[periodName] = splitViewMap[item.category].toFixed(2);
                    return newItem;
                })
            );

            setBarChartComboData(prevData =>
                prevData.map(item => {
                    const newItem = {...item};
                    newItem[periodName] = comboViewMap[item.category].toFixed(2);
                    return newItem;
                })
            );

           return newPairs;
        });
    };

    const removePairAtIndex = (index: number) => {
        // Store the current state before deletion
        const currentBarSeries = [...barSeriesData];
        const periodName = currentBarSeries[index].name;
        
        // Remove the item from barSeriesData and datePairs
        setBarSeriesData(prev => prev.filter((_, i) => i !== index));
        setDatePairs(prev => prev?.filter((_, i) => i !== index) ?? null);
        
        // Remove the period from chart data
        setBarChartSplitData(prevData =>
            prevData.map(item => {
                const newItem = {...item};
                delete newItem[periodName];
                return newItem;
            })
        );
        
        setBarChartComboData(prevData =>
            prevData.map(item => {
                const newItem = {...item};
                delete newItem[periodName];
                return newItem;
            })
        );
        
        // Decrease the period index
        setPeriodIndex(prevIndex => prevIndex - 1);
        
        // Only update custom periods (index >= 2)
        if (index >= 2) {
            // Get all custom periods after the deleted one
            const periodsToUpdate = currentBarSeries
                .filter((_, i) => i > index)
                .filter(item => item.name.startsWith('Custom Period'));
            
            // Update each period's name
            periodsToUpdate.forEach((period, i) => {
                const oldName = period.name;
                const match = oldName.match(/Custom Period (\d+)/);
                
                if (match && match[1]) {
                    const oldNumber = parseInt(match[1], 10);
                    const newName = `Custom Period ${oldNumber - 1}`;
                    
                    // Update the bar chart data with the new name
                    setBarChartSplitData(prevData =>
                        prevData.map(item => {
                            const newItem = {...item};
                            if (oldName in newItem) {
                                newItem[newName] = newItem[oldName];
                                delete newItem[oldName];
                            }
                            return newItem;
                        })
                    );
                    
                    setBarChartComboData(prevData =>
                        prevData.map(item => {
                            const newItem = {...item};
                            if (oldName in newItem) {
                                newItem[newName] = newItem[oldName];
                                delete newItem[oldName];
                            }
                            return newItem;
                        })
                    );
                    
                    // Update the bar series data
                    setBarSeriesData(prev => {
                        const newPrev = [...prev];
                        // Find the index of this period in the new array (after deletion)
                        const newIndex = index + i; // index is the deletion point, i is the offset
                        
                        if (newPrev[newIndex]) {
                            newPrev[newIndex] = {
                                ...newPrev[newIndex],
                                name: newName
                            };
                        }
                        
                        return newPrev;
                    });
                }
            });
        }
    };

    const processAreaChartData = (data: any) => {
        if (!data || !data.documents || data.documents.length === 0) {
            return [];
        }

        // Get all unique categories
        const categories = data.spendingCategories.map((cat: any) => cat.name);
        
        // Sort documents by date
        const sortedDocuments = [...data.documents].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Get the first document date and create a date for the day before
        const firstDocDate = new Date(sortedDocuments[0].timestamp);
        const dayBeforeFirstDoc = new Date(firstDocDate);
        dayBeforeFirstDoc.setDate(dayBeforeFirstDoc.getDate() - 1);
        const dayBeforeFirstDocString = dayBeforeFirstDoc.toISOString().split('T')[0];

        // Group documents by date (using date only, not time)
        const dateGroups: Record<string, any[]> = {};
        
        // Add the day before first document with empty data
        dateGroups[dayBeforeFirstDocString] = [];
        
        sortedDocuments.forEach((doc: any) => {
            const date = new Date(doc.timestamp).toISOString().split('T')[0];
            if (!dateGroups[date]) {
                dateGroups[date] = [];
            }
            dateGroups[date].push(doc);
        });

        // Create area chart data with cumulative spending by category
        const result: any[] = [];
        let cumulativeByCategory: Record<string, number> = {};
        categories.forEach((cat: string | number) => {
            cumulativeByCategory[cat] = 0;
        });

        // Sort the date keys to ensure chronological order
        const sortedDates = Object.keys(dateGroups).sort((a, b) => 
            new Date(a).getTime() - new Date(b).getTime()
        );

        sortedDates.forEach(date => {
            const docs = dateGroups[date];
            
            // Calculate spending by category for this date
            const spendingByCategory: Record<string, number> = {};
            categories.forEach((cat: string | number) => {
                spendingByCategory[cat] = 0;
            });

            docs.forEach((doc: any) => {
                const amount = doc.amountSpent;
                const categoryCount = doc.spendingCategories.length;
                const splitAmount = amount / categoryCount;

                doc.spendingCategories.forEach((category: any) => {
                    spendingByCategory[category.name] += splitAmount;
                });
            });

            // Update cumulative values
            categories.forEach((cat: string | number) => {
                cumulativeByCategory[cat] += spendingByCategory[cat];
            });

            // Create data point for this date with all categories
            const dataPoint: Record<string, any> = { date };
            categories.forEach((cat: string | number) => {
                dataPoint[cat] = parseFloat(cumulativeByCategory[cat].toFixed(2));
            });

            result.push(dataPoint);
        });

        return result;
    };

    return (
        <>
            <Center>
                <Stack align={"center"} w="100%" maw={1200}>
                    <Title>Spending Summary:</Title>

                    {/*Donut chart*/}
                    <Card pb={"xl"} w={"100%"}>
                        <Stack align="center">
                            <Group>
                                <Group align={"flex-end"}>
                                    <Switch
                                        size={"xl"}
                                        onLabel={"Combo"}
                                        offLabel={"Split"}
                                        onChange={() => setDonutSplitView(!donutSplitView)}
                                    />
                                    <DatePickerInput
                                        label="Start Date"
                                        placeholder="Select start date"
                                        value={donutChartStartDate}
                                        onChange={setDonutChartStartDate}
                                        clearable
                                        w={180}
                                    />
                                    <DatePickerInput
                                        label="End Date"
                                        placeholder="Select end date"
                                        value={donutChartEndDate}
                                        onChange={setDonutChartEndDate}
                                        minDate={donutChartStartDate || undefined}
                                        clearable
                                        w={180}
                                    />
                                    <Button
                                        onClick={customDonutChartView ? handleApplyDateRange : () => setCustomDonutChartView(true)}
                                        disabled={!donutChartStartDate || !donutChartEndDate}
                                        variant="outline"
                                        color={customDonutChartView ? "green" : "red"}
                                        w={"80"}
                                    >
                                        {customDonutChartView ? "Apply" : "Back"}
                                    </Button>
                                </Group>
                            </Group>


                            {customDonutChartView ? (
                            <Group>
                                <Card shadow="xl" withBorder>
                                    <Stack align={"center"}>
                                        <Title order={3}>Last 7 days</Title>
                                        <DonutChart
                                            withLabelsLine
                                            labelsType="value"
                                            withLabels
                                            paddingAngle={6}
                                            thickness={25}
                                            data={donutSplitView ? sevenDayDonutSplitView : sevenDayDonutComboView}
                                            // Always use splitView data for the total as it doesn't add extra data
                                            chartLabel={`Total: $${sevenDayDonutSplitView.reduce((sum, item) => sum + item.value, 0).toFixed(2)}`}
                                        />
                                    </Stack>
                                </Card>

                                <Card shadow="xl" withBorder>
                                    <Stack align={"center"}>
                                        <Title order={3}>Last 30 days</Title>
                                        <DonutChart
                                            withLabelsLine
                                            labelsType="value"
                                            withLabels
                                            paddingAngle={6}
                                            thickness={25}
                                            data={donutSplitView ? thirtyDayDonutSplitView : thirtyDayDonutComboView}
                                            // Always use splitView data for the total as it doesn't add extra data
                                            chartLabel={`Total: $${thirtyDayDonutSplitView.reduce((sum, item) => sum + item.value, 0).toFixed(2)}`}
                                        />
                                    </Stack>
                                </Card>

                                <Card shadow="xl" withBorder>
                                    <Stack align={"center"}>
                                        <Title order={3}>All time:</Title>
                                        <DonutChart
                                            withLabelsLine
                                            labelsType="value"
                                            withLabels
                                            paddingAngle={6}
                                            thickness={25}
                                            data={donutSplitView ? totalDonutSplitView : totalDonutComboView}
                                            // Always use splitView data for the total as it doesn't add extra data
                                            chartLabel={`Total: $${totalDonutSplitView.reduce((sum, item) => sum + item.value, 0).toFixed(2)}`}
                                        />
                                    </Stack>
                                </Card>
                            </Group>
                            ) : (
                            <Group>
                                <Card shadow="xl" withBorder>
                                    <Stack align={"center"}>
                                        <Title order={3}>Custom Range</Title>
                                        {customDonutSplitView.length > 0 ? (
                                            <DonutChart
                                                withLabelsLine
                                                labelsType="value"
                                                withLabels
                                                paddingAngle={6}
                                                thickness={25}
                                                data={donutSplitView ? customDonutSplitView : customDonutComboView}
                                                // Always use splitView data for the total as it doesn't add extra data
                                                chartLabel={`Total: $${customDonutSplitView.reduce((sum, item) => sum + item.value, 0).toFixed(2)}`}
                                            />
                                        ) : (
                                            <Center h={200} w={200} style={{ color: 'gray' }}>
                                                No data in this date range
                                            </Center>
                                        )}
                                    </Stack>
                                </Card>
                            </Group>
                            )}
                        </Stack>
                    </Card>

                    {/*Bar chart*/}
                    <Card w={"100%"} shadow="xl" withBorder>
                        <Stack align="center">
                            <Group>
                                <Title order={3}>Categories Comparison</Title>
                                <Switch
                                    size={"xl"}
                                    onLabel={"Combo"}
                                    offLabel={"Split"}
                                    onChange={() => setBarSplitView(!barSplitView)}
                                />
                            </Group>
                            <Group align={"flex-start"} w="100%">
                                <Stack h={"400"} w={"78%"} pl={20} pr={20} pt={10} pb={10}>
                                    <BarChart
                                        h={"400"}
                                        orientation={"vertical"}
                                        series={barSeriesData}
                                        data={barSplitView ? barChartSplitData : barChartComboData}
                                        dataKey="category"
                                        tickLine="y"
                                        maxBarWidth={749}
                                        yAxisProps={{
                                            tickMargin: 10, // Add margin between ticks and labels
                                            width: 120      // Increase width of y-axis area
                                        }}
                                    />
                                </Stack>
                                <ScrollArea h={"400"} w={"20%"}>
                                    <Stack justify={"flex-start"}>
                                        {barSeriesData.length === 0 ? (
                                            <Center>
                                                <Text ta={"center"} size={"xl"}>¯\_(ツ)_/¯</Text>
                                            </Center>
                                        ) : (
                                            barSeriesData.map((item, index) => {
                                                const datePair = datePairs?.[index];
                                                return (
                                                    <Stack key={`bar-item-${item.name}-${index}`} gap={5}>
                                                        <Group justify={"space-between"}>
                                                            <Text size="sm" c="dimmed" fw={700}>{item.name}</Text>
                                                        </Group>
                                                        <Group align={"flex-end"} gap={"xs"}>
                                                            <DatePickerInput
                                                                placeholder="Start"
                                                                valueFormat="DD.MM.YY"
                                                                value={datePair[0]}
                                                                onChange={(date) => updateDatePairStart(index, date)}
                                                                maxDate={datePair[1]}
                                                                clearable
                                                                size={"xs"}
                                                                w={85}
                                                            />
                                                            <DatePickerInput
                                                                placeholder="End"
                                                                valueFormat="DD.MM.YY"
                                                                value={datePair[1]}
                                                                onChange={(date) => updateDatePairEnd(index, date)}
                                                                minDate={datePair[0]}
                                                                clearable
                                                                size={"xs"}
                                                                w={85}
                                                            />
                                                            {/* Only show delete button for bars beyond the first two */}
                                                            {index >= 2 && (
                                                                <ActionIcon
                                                                    onClick={() => removePairAtIndex(index)}
                                                                    color={"red"}
                                                                    variant="subtle"
                                                                    h={"xl"}
                                                                    w={"xl"}
                                                                >
                                                                    <IconX/>
                                                                </ActionIcon>
                                                            )}
                                                        </Group>
                                                    </Stack>
                                                );

                                            }))}
                                        <Center>
                                            <Tooltip label="New period">
                                                <ActionIcon mt={"sm"} mb={"xl"} variant="default" onClick={() => addBarData(responseData, new Date(), new Date())}>
                                                    <IconPlus/>
                                                </ActionIcon>
                                            </Tooltip>
                                        </Center>
                                    </Stack>
                                </ScrollArea>
                            </Group>
                        </Stack>
                    </Card>

                    {/*Area chart*/}
                    <Card w="100%" shadow="xl" withBorder mt={20}>
                        <Stack align="center">
                            <Group>
                                <Title order={3}>Spending by Category Over Time</Title>
                                <Switch
                                    size={"xl"}
                                    onLabel={"Stacked"}
                                    offLabel={"Default"}
                                    onChange={() => setAreaChartMode(!areaChartMode)}
                                />
                            </Group>
                            {areaChartData.length > 0 ? (
                                <AreaChart
                                    h={300}
                                    data={areaChartData}
                                    dataKey="date"
                                    type={areaChartMode ? "default" : "stacked"}
                                    withLegend
                                    withPointLabels={areaChartMode} //Float point issues if in stacked
                                    withGradient={true}
                                    curveType="bump"
                                    tickLine="xy"
                                    gridAxis="xy"
                                    legendProps={{ verticalAlign: 'bottom' }}
                                    series={totalDonutSplitView.map(category => ({
                                        name: category.name,
                                        color: category.color
                                    }))}
                                />
                            ) : (
                                <Center h={300}>No data available</Center>
                            )}
                        </Stack>
                    </Card>
                </Stack>
            </Center>
        </>
    )
};

export default SpendingSummary;