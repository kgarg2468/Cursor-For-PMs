import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mail, CheckCircle2, Ticket, FileText, Plug, ExternalLink } from "lucide-react";
import { useIntegrationsStore } from "@/stores/integrationsStore";

const MCP_SLACK_URL = "https://docs.slack.dev/ai/mcp-server";
const MCP_GMAIL_URL = "https://docs.cloud.google.com/mcp/overview";
const MCP_NOTION_URL = "https://developers.notion.com/docs/mcp";
const MCP_JIRA_URL = "https://github.com/modelcontextprotocol/servers";
const MCP_DOCS_URL = "https://modelcontextprotocol.io";

export const IntegrationsPage = () => {
  const slackConnected = useIntegrationsStore((s) => s.slackConnected);
  const gmailConnected = useIntegrationsStore((s) => s.gmailConnected);
  const jiraConnected = useIntegrationsStore((s) => s.jiraConnected);
  const notionConnected = useIntegrationsStore((s) => s.notionConnected);
  const setSlackConnected = useIntegrationsStore((s) => s.setSlackConnected);
  const setGmailConnected = useIntegrationsStore((s) => s.setGmailConnected);
  const setJiraConnected = useIntegrationsStore((s) => s.setJiraConnected);
  const setNotionConnected = useIntegrationsStore((s) => s.setNotionConnected);

  const integrationCards = [
    {
      id: "slack",
      title: "Slack",
      description: "Post artifact updates to a channel (e.g. #product)",
      icon: MessageSquare,
      connected: slackConnected,
      setConnected: setSlackConnected,
      connectedHint: "When posting from an artifact, you'll choose the channel in the dialog.",
      learnUrl: MCP_SLACK_URL,
    },
    {
      id: "gmail",
      title: "Gmail",
      description: "Create email drafts from artifact content",
      icon: Mail,
      connected: gmailConnected,
      setConnected: setGmailConnected,
      connectedHint: '"Draft in Gmail" will appear on email artifacts in Simulations.',
      learnUrl: MCP_GMAIL_URL,
    },
    {
      id: "jira",
      title: "Jira",
      description: "Create issues from Jira ticket artifacts (Jira Cloud via Atlassian MCP or community servers)",
      icon: Ticket,
      connected: jiraConnected,
      setConnected: setJiraConnected,
      connectedHint: '"Create in Jira" will appear on Jira ticket artifacts in Simulations.',
      learnUrl: MCP_JIRA_URL,
    },
    {
      id: "notion",
      title: "Notion",
      description: "Push PRDs and one-pagers to your Notion workspace (official Notion MCP)",
      icon: FileText,
      connected: notionConnected,
      setConnected: setNotionConnected,
      connectedHint: '"Add to Notion" will appear on document artifacts in Simulations.',
      learnUrl: MCP_NOTION_URL,
    },
  ];

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect Slack, Gmail, Jira, and Notion to post or create artifacts from the Simulations page. You can also configure your own MCP servers.
        </p>
      </div>

      {integrationCards.map(({ id, title, description, icon: Icon, connected, setConnected, connectedHint, learnUrl }) => (
        <Card key={id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>
            {connected && (
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 shrink-0" />
            )}
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={connected ? "outline" : "default"}
                size="sm"
                onClick={() => setConnected(!connected)}
              >
                {connected ? "Disconnect" : `Connect ${title}`}
              </Button>
              {learnUrl && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={learnUrl} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" />
                    MCP docs
                  </a>
                </Button>
              )}
            </div>
            {connected && connectedHint && (
              <p className="text-xs text-muted-foreground mt-2">{connectedHint}</p>
            )}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Plug className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Configure your own MCP</CardTitle>
              <CardDescription>
                Add custom Model Context Protocol servers (e.g. Linear, GitHub, custom APIs) via Cursor or your MCP config.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">
            In Cursor: Settings → MCP → Add server. Use a config file or install community servers from the MCP registry. Servers you add will be available to the AI and can be wired into this app later.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href={MCP_DOCS_URL} target="_blank" rel="noopener noreferrer" className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              Model Context Protocol docs
            </a>
          </Button>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        For this demo, Connect toggles each integration on or off. Full OAuth and MCP wiring can be added later.
      </p>
    </div>
  );
};
