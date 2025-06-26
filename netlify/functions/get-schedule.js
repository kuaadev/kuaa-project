const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const spintronApiKey = process.env.SPINTRON_API_KEY;

    if (!spintronApiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Spintron API key is not configured." })
        };
    }

    // This endpoint fetches all upcoming shows. We'll get a good amount to build a weekly schedule.
    const spintronApiUrl = `https://spintron.com/api/shows?access-token=${spintronApiKey}&station=kuaa&count=150`;

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
        console.error("Error in schedule function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "An internal error occurred." })
        };
    }
};
