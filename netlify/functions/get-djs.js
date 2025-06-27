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
        const personasMap = new Map();
        included.forEach(item => {
            if (item.type === 'personas') {
                personasMap.set(item.id, {
                    id: item.id,
                    name: item.attributes.name,
                    bio: item.attributes.bio,
                    image: item.attributes.image,
                    onAir: false,
                    nextShowTime: null
                });
            }
        });

        // Step 2: Iterate through shows to find the status for each DJ
        shows.forEach(show => {
            if (show.relationships.personas && show.relationships.personas.data) {
                show.relationships.personas.data.forEach(personaRef => {
                    if (personasMap.has(personaRef.id)) {
                        const dj = personasMap.get(personaRef.id);
                        const startTime = new Date(show.attributes.start);
                        const endTime = new Date(show.attributes.end);

                        if (now >= startTime && now < endTime) {
                            dj.onAir = true;
                            dj.nextShowTime = startTime;
                        } else if (startTime > now) {
                            if (!dj.nextShowTime || startTime < dj.nextShowTime) {
                                dj.nextShowTime = startTime;
                            }
                        }
                    }
                });
            }
        });

        // Step 3: Filter for only active DJs (those who have an upcoming or current show)
        const activeDjs = Array.from(personasMap.values()).filter(dj => dj.onAir || dj.nextShowTime);

        const responseData = { items: activeDjs };

        return {
            statusCode: 200,
            body: JSON.stringify(responseData)
        };
    } catch (error) {
        console.error("Error in get-djs function:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "An internal error occurred." }) };
    }
};
