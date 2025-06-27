const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const spinitronApiKey = process.env.SPINITRON_API_KEY;
    if (!spinitronApiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: "Spinitron API key is not configured." }) };
    }

    // Fetch up to 300 shows to ensure we have a full week's schedule
    const showsUrl = `https://spinitron.com/api/shows?access-token=${spinitronApiKey}&station=kuaa&count=300&with=personas`;

    try {
        const response = await fetch(showsUrl, { timeout: 9000 });
        if (!response.ok) {
            return { statusCode: response.status, body: JSON.stringify({ error: `Spinitron API error: ${response.statusText}` }) };
        }
        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error("Error in get-schedule function:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "An internal error occurred." }) };
    }
};
