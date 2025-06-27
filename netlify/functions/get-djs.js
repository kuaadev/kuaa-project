const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const spinitronApiKey = process.env.SPINITRON_API_KEY;
    if (!spinitronApiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: "Spinitron API key is not configured." }) };
    }

    // Fetch the full schedule with personas included
    const showsUrl = `https://spinitron.com/api/shows?access-token=${spinitronApiKey}&station=kuaa&count=200&with=personas`;

    try {
        const response = await fetch(showsUrl, { timeout: 9000 });
        if (!response.ok) {
            return { statusCode: response.status, body: JSON.stringify({ error: `Spinitron API error: ${response.statusText}` }) };
        }
        const scheduleData = await response.json();

        // The related DJ/persona data is in the top-level 'included' array
        const includedData = scheduleData.included || [];
        const shows = scheduleData.data || [];

        const uniqueDjs = new Map();

        // Go through each show on the schedule
        shows.forEach(show => {
            // Check if the show has a relationship to any personas
            if (show.relationships.personas && show.relationships.personas.data) {
                show.relationships.personas.data.forEach(personaRef => {
                    // Find the full persona object in the 'included' array using its ID
                    const persona = includedData.find(inc => inc.type === 'personas' && inc.id === personaRef.id);
                    // If we find the DJ and haven't already added them, add them to our map
                    if (persona && !uniqueDjs.has(persona.id)) {
                        uniqueDjs.set(persona.id, persona);
                    }
                });
            }
        });

        // Convert the Map of unique DJs back into an array of objects the frontend can use.
        const djsArray = Array.from(uniqueDjs.values()).map(dj => ({
            id: dj.id,
            name: dj.attributes.name,
            bio: dj.attributes.bio,
            image: dj.attributes.image
        }));

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
