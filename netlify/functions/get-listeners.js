const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const streamStatsUrl = 'https://stream.xmission.com/status-json.xsl';

    try {
        const response = await fetch(streamStatsUrl);
        if (!response.ok) {
            // If the fetch itself fails, return a clear error.
            return { statusCode: response.status, body: JSON.stringify({ count: 0, error: "Could not fetch stream stats." }) };
        }
        const data = await response.json();

        // Check if the primary data structure is missing.
        if (!data || !data.icestats || !data.icestats.source) {
            return { statusCode: 200, body: JSON.stringify({ count: 0 }) };
        }

        // The 'source' can be an object (one stream) or an array (multiple streams).
        // This makes sure we are always working with an array.
        const sourceArray = Array.isArray(data.icestats.source) ? data.icestats.source : [data.icestats.source];

        // Find the specific mountpoint for 'kuaa'.
        const mountpoint = sourceArray.find(s => s && s.listenurl && s.listenurl.includes('kuaa'));

        // If 'kuaa' isn't streaming, return 0.
        if (!mountpoint) {
            return { statusCode: 200, body: JSON.stringify({ count: 0 }) };
        }

        // Safely get the listener count.
        const listenerCount = mountpoint.listeners || 0;
        const listenerInfo = {
            count: listenerCount,
        };

        return {
            statusCode: 200,
            body: JSON.stringify(listenerInfo)
        };
    } catch (error) {
        console.error("Error in get-listeners function:", error);
        return { statusCode: 500, body: JSON.stringify({ count: 0, error: "An internal error occurred." }) };
    }
};
