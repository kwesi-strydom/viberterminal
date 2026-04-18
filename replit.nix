{ pkgs }: {
  # The `modules = ["nodejs-20"]` line in .replit gives us Node 20 and npm
  # automatically. We just keep this file minimal and let Replit do its
  # standard nodejs setup.
  deps = [
    pkgs.nodejs_20
  ];
}
