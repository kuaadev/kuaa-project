const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const spinitronApiKey = process.env.SPINITRON_API_KEY;
    if (!spinitronApiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: "Spinitron API key is not configured." }) };
    }

    const spinitronApiUrl = `https://spinitron.com/api/personas?access-token=${spinitronApiKey}&station=kuaa&count=100`;

    try {
        const response = await fetch(spinitronApiUrl, { timeout: 8000 }); // Added a timeout
        if (!response.ok) {
            return { statusCode: response.status, body: JSON.stringify({ error: `Spinitron API error: ${response.statusText}` }) };
        }
        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error("Error in get-djs function:", error);
        // If it's a timeout error, send a specific message
        if (error.type === 'request-timeout') {
            return { statusCode: 504, body: JSON.stringify({ error: "Gateway timeout: The Spinitron API took too long to respond." }) };
        }
        return { statusCode: 500, body: JSON.stringify({ error: "An internal error occurred." }) };
    }
};
