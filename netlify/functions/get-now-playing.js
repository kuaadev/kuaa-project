const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const spinitronApiKey = process.env.SPINITRON_API_KEY;
    if (!spinitronApiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: "Spinitron API key is not configured." }) };
    }

    const spinsUrl = `https://spinitron.com/api/spins?access-token=${spinitronApiKey}&station=kuaa&count=1&with=show.personas`;

    try {
        const spinsResponse = await fetch(spinsUrl);
        if (!spinsResponse.ok) { throw new Error('Failed to fetch spins.'); }
        const spinsData = await spinsResponse.json();

        // Case 1: A song is actively playing, and we have all the info we need.
        if (spinsData.items && spinsData.items.length > 0) {
            const latestSpin = spinsData.items[0];
            const included = spinsData.included || [];

            let showTitle = "Community Programming";
            let djName = "KUAA";

            if (latestSpin.relationships.show.data) {
                const showId = latestSpin.relationships.show.data.id;
                const showData = included.find(inc => inc.type === 'shows' && inc.id === showId);
                if (showData) {
                    showTitle = showData.attributes.title;
                    if (showData.relationships.personas.data.length > 0) {
                        djName = showData.relationships.personas.data.map(pRef => {
                            const persona = included.find(inc => inc.type === 'personas' && inc.id === pRef.id);
                            return persona ? persona.attributes.name : '';
                        }).filter(Boolean).join(' & ');
                    }
                }
            }

            const responseData = {
                song: latestSpin.song || 'Music Variety',
                artist: latestSpin.artist || 'Various Artists',
                release: latestSpin.release,
                image: latestSpin.image,
                showTitle: showTitle,
                djName: djName
            };
            return { statusCode: 200, body: JSON.stringify(responseData) };
        }

        // Case 2: No active song, so fetch the currently scheduled show.
        const showsUrl = `https://spinitron.com/api/shows?access-token=${spinitronApiKey}&station=kuaa&count=1&with=personas`;
        const showsResponse = await fetch(showsUrl);
        if (!showsResponse.ok) { throw new Error('Failed to fetch current show.'); }
        const showsData = await showsResponse.json();

        if (showsData.data && showsData.data.length > 0) {
            const currentShow = showsData.data[0];
            const includedDjs = showsData.included || [];
            const djName = (currentShow.relationships.personas.data.length > 0)
                ? currentShow.relationships.personas.data.map(pRef => {
                    const persona = includedDjs.find(inc => inc.type === 'personas' && inc.id === pRef.id);
                    return persona ? persona.attributes.name : '';
                }).filter(Boolean).join(' & ')
                : 'KUAA';

            const responseData = {
                song: 'Automated Mix',
                artist: 'KUAA',
                image: null,
                showTitle: currentShow.attributes.title,
                djName: djName
            };
            return { statusCode: 200, body: JSON.stringify(responseData) };
        }

        throw new Error("No data available.");

    } catch (error) {
        console.error("Error in get-now-playing function:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "An internal error occurred." }) };
    }
};
