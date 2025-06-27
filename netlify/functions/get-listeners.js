const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const streamStatsUrl = 'https://stream.xmission.com/status-json.xsl';

    try {
        const response = await fetch(streamStatsUrl);
        if (!response.ok) {
            return { statusCode: 200, body: JSON.stringify({ count: 0, error: "Could not fetch stream stats." }) };
        }
        const data = await response.json();

        if (!data || !data.icestats || !data.icestats.source) {
            return { statusCode: 200, body: JSON.stringify({ count: 0 }) };
        }

        const sourceArray = Array.isArray(data.icestats.source) ? data.icestats.source : [data.icestats.source];

        const mountpoint = sourceArray.find(s => s && s.listenurl && s.listenurl.includes('kuaa'));

        if (!mountpoint) {
            return { statusCode: 200, body: JSON.stringify({ count: 0 }) };
        }

        const listenerCount = mountpoint.listeners || 0;

        return {
            statusCode: 200,
            body: JSON.stringify({ count: listenerCount })
        };
    } catch (error) {
        console.error("Error in get-listeners function:", error);
        return { statusCode: 500, body: JSON.stringify({ count: 0, error: "An internal error occurred." }) };
    }
};
