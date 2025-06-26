const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const spinitronApiKey = process.env.SPINITRON_API_KEY;

    if (!spinitronApiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Spinitron API key is not configured." })
        };
    }

    // This now correctly includes `with=show` and `with=personas`
    const spinitronApiUrl = `https://spinitron.com/api/spins?access-token=${spinitronApiKey}&station=kuaa&count=1&with=show,personas`;

    try {
        const response = await fetch(spinitronApiUrl);

        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `Spinitron API error: ${response.statusText}` })
            };
        }

        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error("Error in serverless function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "An internal error occurred." })
        };
    }
};
