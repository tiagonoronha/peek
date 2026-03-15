/**
 * About tab showing app version and update controls.
 * @module settings/tabs/AboutTab
 */

import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import appIcon from "@/assets/app-icon.png";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
} from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import {
  checkForUpdates,
  downloadAndInstall,
  getUpdateVersion,
  onUpdateFound,
} from "@/services/updater";
import { GITHUB_URL } from "@/shared/constants";

/**
 * Tab showing app info, version, and update controls.
 */
export function AboutTab() {
  const [version, setVersion] = useState<string>();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(false);
  const [checked, setChecked] = useState(() => getUpdateVersion() !== null);
  const [updateVersion, setUpdateVersion] = useState<string | null>(
    getUpdateVersion()
  );

  useEffect(() => {
    getVersion().then(setVersion);

    // React to background update checks finding a new version
    const unsubscribe = onUpdateFound(({ version }) => {
      setUpdateVersion(version);
      setChecked(true);
    });
    return unsubscribe;
  }, []);

  const handleCheckForUpdates = useCallback(async () => {
    setChecking(true);
    setError(false);
    try {
      const result = await checkForUpdates();
      setChecked(true);
      if (result.available) {
        setUpdateVersion(result.version ?? null);
      }
    } catch {
      setError(true);
    } finally {
      setChecking(false);
    }
  }, []);

  const handleInstallUpdate = useCallback(async () => {
    await downloadAndInstall();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <img
            src={appIcon}
            alt="Peek"
            className="h-10 w-10 rounded-lg"
          />
          <div>
            <CardTitle>Peek</CardTitle>
            <CardDescription>
              A lightweight macOS menu bar app for Home Assistant.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-fg-muted">Installed version</span>
            <span className="text-sm font-medium text-fg">{version ?? "…"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-fg-muted">Latest version</span>
            {checking ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-fg-muted">
                <Spinner size="sm" />
                Checking…
              </span>
            ) : updateVersion ? (
              <button
                onClick={handleInstallUpdate}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                Update to {updateVersion}
              </button>
            ) : checked ? (
              <span className="text-sm text-fg-muted">You&apos;re on the latest version</span>
            ) : error ? (
              <button
                onClick={handleCheckForUpdates}
                className="text-sm text-red-400 hover:text-red-300 transition-colors cursor-pointer"
              >
                Couldn&apos;t check for updates. Retry?
              </button>
            ) : (
              <button
                onClick={handleCheckForUpdates}
                className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                <RefreshCw size={14} />
                Check for updates
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-fg-muted">Source code</span>
            <button
              onClick={() => openUrl(GITHUB_URL)}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              GitHub
            </button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
