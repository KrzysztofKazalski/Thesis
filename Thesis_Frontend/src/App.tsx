import {Route, Routes} from "react-router-dom";
import Homepage from "./pages/Homepage";
import PageNotFound from "./pages/PageNotFound.tsx";
import Shell from "./components/Shell.tsx";
import Documents from "./pages/Documents.tsx";
import Categories from "./pages/Categories.tsx";
import SpendingSummary from "./pages/SpendingSummary.tsx";
import ProtectedRoute from "./utility/ProtectedRoute.tsx";
import Login from "./pages/Login.tsx";
import { useDisclosure } from "@mantine/hooks";
import ViewDocument from "./pages/ViewDocument.tsx";
import UserHome from "./pages/UserHome.tsx";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext.tsx";

function App() {
    const [loginOpened, { open: openLogin, close: closeLogin }] = useDisclosure(false);
    const { user } = useContext(AuthContext);
    return (
        <>
            <Shell openLogin={openLogin} closeLogin={closeLogin} loginOpened={loginOpened}>
                <Routes>
                    <Route path={"/"} element={
                        user ? <ProtectedRoute><UserHome/></ProtectedRoute> : <Homepage openLogin={openLogin}/>
                    }/>
                    <Route path={"*"} element={<PageNotFound/>}/>
                    <Route path={"/documents"} element={
                        <ProtectedRoute><Documents/></ProtectedRoute>}/>
                    <Route path={"/categories"} element={
                        <ProtectedRoute><Categories/></ProtectedRoute>}/>
                    <Route path={"spendingSummary"} element={
                        <ProtectedRoute><SpendingSummary/></ProtectedRoute>}/>
                    <Route path="/login" element={<Login openLogin={openLogin}/>}/>
                    <Route path="/register" element={<Login openLogin={openLogin}/>}/>
                    <Route path="/documents/view" element={
                        <ProtectedRoute><ViewDocument/></ProtectedRoute>
                    }/>
                </Routes>
            </Shell>
        </>
    )
}

export default App;
