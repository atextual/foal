export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const count = query.count || '10';

  const url = `https://api.neds.com.au/rest/v1/racing/?method=nextraces&count=${count}`;

  try {
    const response = await $fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch race data',
    });
  }
});
