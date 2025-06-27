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
        const now = new Date();

        // Step 1: Create a lookup map of all personas from the 'included' array.
        const allPersonasMap = new Map();
        included.forEach(item => {
            if (item.type === 'personas') {
                allPersonasMap.set(item.id, item);
            }
        });

        // Step 2: Create a set of all persona IDs that are actually hosting a show.
        const activePersonaIds = new Set();
        shows.forEach(show => {
            if (show.relationships.personas && show.relationships.personas.data) {
                show.relationships.personas.data.forEach(pRef => activePersonaIds.add(pRef.id));
            }
        });

        // Step 3: Build the final list of unique, active DJs.
        const djs = [];
        activePersonaIds.forEach(id => {
            const persona = allPersonasMap.get(id);
            if (persona) {
                djs.push({
                    id: persona.id,
                    name: persona.attributes.name,
                    bio: persona.attributes.bio,
                    image: persona.attributes.image,
                    nextShowTime: null,
                    onAir: false
                });
            }
        });

        // Step 4: Find the "On Air" and "Next Up" status for each active DJ.
        djs.forEach(dj => {
            shows.forEach(show => {
                const personaIdsInShow = (show.relationships.personas.data || []).map(p => p.id);
                if (personaIdsInShow.includes(dj.id)) {
                    const startTime = new Date(show.attributes.start);
                    const endTime = new Date(show.attributes.end);
                    if (now >= startTime && now < endTime) {
                        dj.onAir = true;
                        dj.nextShowTime = startTime;
                    } else if (startTime > now && (!dj.nextShowTime || startTime < dj.nextShowTime)) {
                        dj.nextShowTime = startTime;
                    }
                }
            });
        });

        const responseData = { items: djs };

        return {
            statusCode: 200,
            body: JSON.stringify(responseData)
        };
    } catch (error) {
        console.error("Error in get-djs function:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "An internal error occurred." }) };
    }
};
