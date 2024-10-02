interface WikipediaResponse {
  query: {
    categorymembers: Array<{
      pageid: number;
      ns: number;
      title: string;
    }>;
  };
  continue?: {
    cmcontinue: string;
    continue: string;
  };
}

export async function fetchMusicalGroupsFromToronto() {
  const baseUrl = "https://en.wikipedia.org/w/api.php";
  const params = new URLSearchParams({
    action: "query",
    list: "categorymembers",
    cmtitle: "Category:Musical_groups_from_Toronto",
    cmtype: "page",
    cmlimit: "500",
    format: "json",
    origin: "*",
  });

  let allGroups: any[] = [];
  let cmcontinue: string | undefined;

  do {
    if (cmcontinue) {
      params.set("cmcontinue", cmcontinue);
    }

    const response = await fetch(`${baseUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: WikipediaResponse =
      (await response.json()) as unknown as WikipediaResponse;

    const groups = data.query.categorymembers.map((member) => member);
    allGroups = allGroups.concat(groups);

    cmcontinue = data.continue?.cmcontinue;
  } while (cmcontinue);

  return allGroups;
}
