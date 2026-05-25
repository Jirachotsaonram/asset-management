const ftp = require("basic-ftp")

async function fixPaths() {
    const client = new ftp.Client()
    try {
        await client.access({
            host: "ftpupload.net",
            user: "if0_42016119",
            password: "3Two1AhSi0r7",
            secure: false
        })
        console.log("Connected")
        // Rename deeply nested folder to root htdocs/api
        await client.rename("/htdocs/htdocs/asset_management_api/htdocs/asset_management_api", "/htdocs/asset_management_api_new")
        console.log("Renamed")
    }
    catch(err) {
        console.error(err)
    }
    client.close()
}

fixPaths()
