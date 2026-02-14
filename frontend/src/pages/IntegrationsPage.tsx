import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mail, CheckCircle2 } from "lucide-react";
import { useIntegrationsStore } from "@/stores/integrationsStore";

export const IntegrationsPage = () => {
  const slackConnected = useIntegrationsStore((s) => s.slackConnected);
  const gmailConnected = useIntegrationsStore((s) => s.gmailConnected);
  const setSlackConnected = useIntegrationsStore((s) => s.setSlackConnected);
  const setGmailConnected = useIntegrationsStore((s) => s.setGmailConnected);

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect Slack and Gmail to post artifacts or create drafts from the Simulations page.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Slack</CardTitle>
              <CardDescription>
                Post artifact updates to a channel (e.g. #product)
              </CardDescription>
            </div>
          </div>
          {slackConnected && (
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 shrink-0" />
          )}
        </CardHeader>
        <CardContent>
          <Button
            variant={slackConnected ? "outline" : "default"}
            size="sm"
            onClick={() => setSlackConnected(!slackConnected)}
          >
            {slackConnected ? "Disconnect" : "Connect Slack"}
          </Button>
          {slackConnected && (
            <p className="text-xs text-muted-foreground mt-2">
              When posting from an artifact, you’ll choose the channel in the dialog.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Gmail</CardTitle>
              <CardDescription>
                Create email drafts from artifact content
              </CardDescription>
            </div>
          </div>
          {gmailConnected && (
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 shrink-0" />
          )}
        </CardHeader>
        <CardContent>
          <Button
            variant={gmailConnected ? "outline" : "default"}
            size="sm"
            onClick={() => setGmailConnected(!gmailConnected)}
          >
            {gmailConnected ? "Disconnect" : "Connect Gmail"}
          </Button>
          {gmailConnected && (
            <p className="text-xs text-muted-foreground mt-2">
              “Draft in Gmail” will appear on email artifacts in Simulations.
            </p>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        For this demo, Connect toggles the integration on or off. Full OAuth and API configuration can be added later.
      </p>
    </div>
  );
};
