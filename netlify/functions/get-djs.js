const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const spinitronApiKey = process.env.SPINITRON_API_KEY;
    if (!spinitronApiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: "Spinitron API key is not configured." }) };
    }

    const showsUrl = `https://spinitron.com/api/shows?access-token=${spinitronApiKey}&station=kuaa&count=200&with=personas`;

    try {
        const response = await fetch(showsUrl, { timeout: 9000 });
        if (!response.ok) {
            return { statusCode: response.status, body: JSON.stringify({ error: `Spinitron API error: ${response.statusText}` }) };
        }
        const scheduleData = await response.json();

        const shows = scheduleData.data || [];
        const included = scheduleData.included || [];
        const uniqueDjs = new Map();
        const now = new Date();

        // Step 1: Extract all unique DJs from the schedule
        shows.forEach(show => {
            if (show.relationships.personas && show.relationships.personas.data.length > 0) {
                show.relationships.personas.data.forEach(personaRef => {
                    if (!uniqueDjs.has(personaRef.id)) {
                        const persona = included.find(inc => inc.type === 'personas' && inc.id === personaRef.id);
                        if (persona) {
                            uniqueDjs.set(persona.id, {
                                id: persona.id,
                                name: persona.attributes.name,
                                bio: persona.attributes.bio,
                                image: persona.attributes.image,
                                nextShowTime: null, // Initialize next show time
                                onAir: false
                            });
                        }
                    }
                });
            }
        });

        // Step 2: Find the "On Air" show and the "Next Up" time for each DJ
        shows.forEach(show => {
            const startTime = new Date(show.attributes.start);
            const endTime = new Date(show.attributes.end);

            if (show.relationships.personas && show.relationships.personas.data.length > 0) {
                show.relationships.personas.data.forEach(personaRef => {
                    const dj = uniqueDjs.get(personaRef.id);
                    if (!dj) return;

                    // Check if this show is currently on air
                    if (now >= startTime && now < endTime) {
                        dj.onAir = true;
                        dj.nextShowTime = startTime; // The current show is the "next" for sorting purposes
                    }
                    // Find the soonest upcoming show for this DJ
                    else if (startTime > now && (!dj.nextShowTime || startTime < dj.nextShowTime)) {
                        dj.nextShowTime = startTime;
                    }
                });
            }
        });

        const djsArray = Array.from(uniqueDjs.values());

        const responseData = {
            items: djsArray
        };

        return {
            statusCode: 200,
            body: JSON.stringify(responseData)
        };
    } catch (error) {
        console.error("Error in get-djs function:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "An internal error occurred." }) };
    }
};
