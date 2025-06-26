const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const spinitronApiKey = process.env.SPINITRON_API_KEY;

    if (!spinitronApiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Spinitron API key is not configured." })
        };
    }

    // This endpoint fetches all upcoming shows. We'll get a good amount to build a weekly schedule.
    const spinitronApiUrl = `https://spinitron.com/api/shows?access-token=${spinitronApiKey}&station=kuaa&count=150`;

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
        console.error("Error in schedule function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "An internal error occurred." })
        };
    }
};
