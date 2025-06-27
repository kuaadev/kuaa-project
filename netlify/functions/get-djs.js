const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const spinitronApiKey = process.env.SPINITRON_API_KEY;
    if (!spinitronApiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: "Spinitron API key is not configured." }) };
    }

    // Fetch the full schedule to get shows and their associated DJs
    const showsUrl = `https://spinitron.com/api/shows?access-token=${spinitronApiKey}&station=kuaa&count=200&with=personas`;

    try {
        const response = await fetch(showsUrl, { timeout: 9000 });
        if (!response.ok) {
            return { statusCode: response.status, body: JSON.stringify({ error: `Spinitron API error: ${response.statusText}` }) };
        }
        const data = await response.json();

        // Use a Map to store unique DJs, keyed by their ID, to prevent duplicates.
        const uniqueDjs = new Map();

        // Process the shows to build a unique list of DJs
        if (data.items && Array.isArray(data.items)) {
            data.items.forEach(show => {
                if (show.personas && Array.isArray(show.personas)) {
                    show.personas.forEach(dj => {
                        // Ensure the DJ object is valid and has an ID before adding.
                        if (dj && dj.id && !uniqueDjs.has(dj.id)) {
                            uniqueDjs.set(dj.id, dj);
                        }
                    });
                }
            });
        }

        // Convert the Map of unique DJs back into an array.
        const djsArray = Array.from(uniqueDjs.values());

        // The front-end expects an object with an 'items' property.
        const responseData = {
            items: djsArray
        };

        return {
            statusCode: 200,
            body: JSON.stringify(responseData)
        };
    } catch (error) {
        console.error("Error in get-djs function:", error);
        if (error.type === 'request-timeout') {
            return { statusCode: 504, body: JSON.stringify({ error: "Gateway timeout: The Spinitron API took too long to respond." }) };
        }
        return { statusCode: 500, body: JSON.stringify({ error: "An internal error occurred." }) };
    }
};
