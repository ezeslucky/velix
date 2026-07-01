import ptyDaemonPackageJson from "@velix/pty-daemon/package.json" with {
	type: "json",
};

export const EXPECTED_DAEMON_VERSION: string = ptyDaemonPackageJson.version;
