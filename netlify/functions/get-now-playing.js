const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const spintronApiKey = process.env.SPINTRON_API_KEY;

    if (!spintronApiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Spintron API key is not configured." })
        };
    }

    const spintronApiUrl = `https://spinitron.com/api/spins?access-token=${spintronApiKey}&station=kuaa&count=1`;

    try {
        const response = await fetch(spintronApiUrl);

        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `Spintron API error: ${response.statusText}` })
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