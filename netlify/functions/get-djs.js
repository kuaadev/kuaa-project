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
                // The related DJ info is in the `included` array. We need to find them.
                if (show.relationships.personas && show.relationships.personas.data.length > 0) {
                    show.relationships.personas.data.forEach(personaRef => {
                        if (!uniqueDjs.has(personaRef.id)) {
                            // Find the full persona object in the 'included' array
                            const persona = data.included.find(inc => inc.type === 'personas' && inc.id === personaRef.id);
                            if (persona) {
                                uniqueDjs.set(persona.id, persona);
                            }
                        }
                    });
                }
            });
        }

        // Convert the Map of unique DJs back into an array of objects the frontend can use.
        const djsArray = Array.from(uniqueDjs.values()).map(dj => ({
            id: dj.id,
            name: dj.attributes.name,
            bio: dj.attributes.bio,
            image: dj.attributes.image
        }));

        // Return the data in the format the front-end expects
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
