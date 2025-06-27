const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const spinitronApiKey = process.env.SPINITRON_API_KEY;
    if (!spinitronApiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: "Spinitron API key is not configured." }) };
    }

    const spinsUrl = `https://spinitron.com/api/spins?access-token=${spinitronApiKey}&station=kuaa&count=1&with=show,personas`;

    try {
        const spinsResponse = await fetch(spinsUrl, { timeout: 9000 });
        if (!spinsResponse.ok) { throw new Error('Failed to fetch spins.'); }
        const spinsData = await spinsResponse.json();

        if (spinsData.items && spinsData.items.length > 0) {
            const latestSpin = spinsData.items[0];
            const included = spinsData.included || [];

            let showTitle = "Community Programming";
            let djName = "KUAA";

            const showRef = latestSpin.relationships.show.data;
            if (showRef) {
                const showData = included.find(inc => inc.type === 'shows' && inc.id === showRef.id);
                if (showData) {
                    showTitle = showData.attributes.title;
                    const personasRef = showData.relationships.personas.data;
                    if (personasRef && personasRef.length > 0) {
                        const djNames = personasRef.map(pRef => {
                            const persona = included.find(inc => inc.type === 'personas' && inc.id === pRef.id);
                            return persona ? persona.attributes.name : null;
                        }).filter(Boolean);
                        if (djNames.length > 0) {
                            djName = djNames.join(' & ');
                        }
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

        const showsUrl = `https://spinitron.com/api/shows?access-token=${spinitronApiKey}&station=kuaa&count=1&with=personas`;
        const showsResponse = await fetch(showsUrl);
        if (!showsResponse.ok) { throw new Error('Failed to fetch current show.'); }
        const showsData = await showsResponse.json();

        if (showsData.data && showsData.data.length > 0) {
            const currentShow = showsData.data[0];
            const includedDjs = showsData.included || [];
            let djName = 'KUAA';
            const personasRef = currentShow.relationships.personas.data;

            if (personasRef && personasRef.length > 0) {
                const djNames = personasRef.map(pRef => {
                    const persona = includedDjs.find(inc => inc.type === 'personas' && inc.id === pRef.id);
                    return persona ? persona.attributes.name : null;
                }).filter(Boolean);

                if (djNames.length > 0) {
                    djName = djNames.join(' & ');
                }
            }

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
