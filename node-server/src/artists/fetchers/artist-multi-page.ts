interface WikipediaApiResponse {
  query: {
    pages: {
      [pageId: string]: {
        pageid: number;
        title: string;
        extract: string;
        missing?: boolean;
      };
    };
  };
}

type WikipediaContent = {
  pageId: number;
  title: string;
  content: string;
};

type ContentCallback = (content: WikipediaContent) => Promise<void>;

export async function fetchWikipediaContent(
  pageIds: number[],
  callback: ContentCallback,
  batchSize: number = 10
): Promise<void> {
  const baseUrl = "https://en.wikipedia.org/w/api.php";

  // Process pageIds in batches
  for (let i = 0; i < pageIds.length; i += batchSize) {
    const batch = pageIds.slice(i, i + batchSize);
    const batchPromises = batch.map(async (pageId) => {
      const url = new URL(baseUrl);
      url.searchParams.append("action", "query");
      url.searchParams.append("format", "json");
      url.searchParams.append("prop", "extracts");
      url.searchParams.append("explaintext", "1");
      url.searchParams.append("pageids", pageId.toString());

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = (await response.json()) as WikipediaApiResponse;
        const page = data.query.pages[pageId.toString()];

        if (page.missing) {
          console.log(`Page ID ${pageId} not found.`);
          return;
        }

        const content: WikipediaContent = {
          pageId: page.pageid,
          title: page.title,
          content: page.extract,
        };

        await callback(content);
        console.log(`Processed content for page ID ${pageId}`);
      } catch (error) {
        console.error(`Error fetching page ID ${pageId}:`, error);
      }
    });

    // Wait for all promises in the current batch to resolve
    await Promise.all(batchPromises);
  }
}
