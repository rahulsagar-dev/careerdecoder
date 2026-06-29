import { useState, useEffect } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCookieConsent } from "@/context/CookieConsentContext";

const CookieConsent = () => {
  const { preferences, showBanner, preferencesOpen, openPreferences, closePreferences, acceptAll, rejectAll, savePreferences } = useCookieConsent();
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (preferencesOpen) {
      setAnalytics(preferences?.analytics ?? false);
      setMarketing(preferences?.marketing ?? false);
    }
  }, [preferencesOpen, preferences]);

  return (
    <>
      {showBanner && (
        <div className="fixed bottom-0 inset-x-0 z-50 p-4 pointer-events-none">
          <div className="max-w-4xl mx-auto bg-card border shadow-lg rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 pointer-events-auto">
            <div className="flex gap-3 flex-1">
              <div className="hidden sm:flex w-10 h-10 rounded-full bg-primary/10 items-center justify-center shrink-0">
                <Cookie className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm">We use cookies</p>
                <p className="text-xs text-muted-foreground">
                  We use cookies to improve your experience. You can choose which cookies to accept.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button variant="ghost" size="sm" onClick={openPreferences}>Manage</Button>
              <Button variant="outline" size="sm" onClick={rejectAll}>Reject All</Button>
              <Button size="sm" className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)]" onClick={acceptAll}>Accept All</Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={preferencesOpen} onOpenChange={(o) => !o && closePreferences()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cookie Preferences</DialogTitle>
            <DialogDescription>Choose which categories of cookies you'd like to allow.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Essential Cookies</p>
                <p className="text-xs text-muted-foreground">Required for the app to function. Always on.</p>
              </div>
              <Switch checked disabled />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Analytics Cookies</p>
                <p className="text-xs text-muted-foreground">Help us understand how you use the app.</p>
              </div>
              <Switch checked={analytics} onCheckedChange={setAnalytics} />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Marketing Cookies</p>
                <p className="text-xs text-muted-foreground">Used to show relevant content.</p>
              </div>
              <Switch checked={marketing} onCheckedChange={setMarketing} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={rejectAll}>Reject All</Button>
            <Button onClick={() => savePreferences(analytics, marketing)} className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)]">
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsent;
