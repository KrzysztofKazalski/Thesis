using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Thesis_backend.Controllers;

[ApiController]
[Route("[controller]")]
public class S3Controller : ControllerBase
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;

    public S3Controller(IAmazonS3 s3Client, IConfiguration configuration)
    {
        _s3Client = s3Client;
        _bucketName = configuration["AWS:BucketName"];
    }

    [HttpGet("generate-presigned-url")]
    // [AllowAnonymous] //Might need to be anonymous, but we'll see
    public IActionResult GeneratePreSignedUrl([FromQuery] string folderName, [FromQuery] string fileName)
    {
        /*
         * If we set the key to fileName only, we encounter duplication issues if a file with the same name is
         * uploaded to the S3 database. By adding the dateTime to the key, the issue should be avoided.
         * (Except if someone decides to upload the same file at the EXACT same time)
         * Also set a custom format with ToString so we get something like "FileName_2025031419025022"
         */
        if (!(folderName == "documents" | folderName == "profile-pictures"))
            return BadRequest("Folder name should be one of these: documents, profile-pictures");
        
        var recordName = $"{folderName}/{fileName}_{DateTime.UtcNow.ToString("yyyyMMddHHmmssff")}";
        
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = recordName,
            Expires = DateTime.UtcNow.AddMinutes(10),
            Verb = HttpVerb.PUT
        };

        var url = _s3Client.GetPreSignedURL(request);
        return Ok(new {url});
    }
}