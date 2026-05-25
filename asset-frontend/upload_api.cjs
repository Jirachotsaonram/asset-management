const ftp = require("basic-ftp")
const path = require("path")

async function uploadApi() {
    const client = new ftp.Client()
    client.ftp.verbose = true
    try {
        await client.access({
            host: "ftpupload.net",
            user: "if0_42016119",
            password: "3Two1AhSi0r7",
            secure: false
        })
        console.log("Connected to FTP")
        
        await client.ensureDir("htdocs")
        await client.ensureDir("htdocs/asset_management_api")
        await client.clearWorkingDir()
        
        console.log("Uploading API files...")
        await client.uploadFromDir("d:/xampp_assets/htdocs/asset-management/asset_management_api", "htdocs/asset_management_api")
        console.log("Upload finished!")
    }
    catch(err) {
        console.error("FTP Error:", err)
    }
    client.close()
}

uploadApi()
