interface WikipediaApiResponse {
  query?: {
    pages?: {
      [pageId: string]: {
        extract?: string;
      };
    };
  };
}

export async function getPageContent(pageId: number): Promise<string> {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&pageids=${pageId}&explaintext=1&exsectionformat=plain`;

  try {
    const response = await fetch(apiUrl);
    const data: WikipediaApiResponse =
      (await response.json()) as unknown as WikipediaApiResponse;

    if (data.query?.pages?.[pageId]?.extract) {
      return data.query.pages[pageId].extract;
    } else {
      throw new Error("Page not found or invalid response structure");
    }
  } catch (error) {
    console.error("Error fetching Wikipedia page:", error);
    throw error;
  }
}
