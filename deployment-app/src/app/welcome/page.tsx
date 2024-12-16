"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

function Page() {
  const { data: session } = useSession();
  const [repositories, setRepositories] = useState<any[]>([]);

  useEffect(() => {
    const fetchRepos = async () => {
      if (!session?.accessToken || !session?.username) {
        console.error("Missing session data");
        return;
      }

      try {
        const response = await fetch(`/api/git?username=${session.username}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Error fetching repositories: ${response.statusText}`);
        }

        const data = await response.json();
        setRepositories(data);
      } catch (error) {
        console.error("Failed to fetch repositories:", error);
      }
    };

    fetchRepos();
  }, [session]);

  return (
    <div>
      <h1>User Information</h1>
      {session ? (
        <div>
          <p>
            <strong>Access Token:</strong> {session.accessToken}
          </p>
          <p>
            <strong>Username:</strong> {session.username}
          </p>
          <div>
            <h2>Repositories</h2>
            <ul>
              {repositories.map((repo) => (
                <li key={repo.id}>
                  <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                    {repo.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p>You are not logged in.</p>
      )}
    </div>
  );
}

export default Page;
