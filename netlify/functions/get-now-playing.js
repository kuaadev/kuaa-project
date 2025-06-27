const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const spinitronApiKey = process.env.SPINITRON_API_KEY;

    if (!spinitronApiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Spinitron API key is not configured." })
        };
    }

    // This is the single, correct endpoint to get the current song AND its associated show/DJ info.
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

        // The data is now passed directly to the frontend, which will handle the logic.
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error("Error in get-now-playing function:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "An internal error occurred." }) };
    }
};
