# Cursor Popups
Causes a predetermined icon to appear at your cursor when you hold down a key, visible to all other players. Each player can select their desired keybind in the settings menu. This module is meant to replicate functionality seen in the MapTool VTT, such as players/GM putting a speech bubble on their character to show who is talking, or using an arrow to show where their character is looking, etc.

By default, `T` activates the speech bubble, and `Y` activates the arrow.

Pressing the key replaces the normal player cursors that are usually visible, so those must be enabled in order for a player to use this feature.

## Installation
In the Foundry VTT module manager, click the Install Module button and paste this URL into the Manifest URL box, then click Install: `https://raw.githubusercontent.com/kree-nickm/fvtt-cursor-popups/main/module.json`

You also need to install the [libWrapper](https://github.com/ruipin/fvtt-lib-wrapper) module, but that should happen automatically when you do the above.

## Compatibility
Because this module now utilizes libWrapper, there should no longer be any compatibility issues caused by this module. If there are any issues, it's the other module's fault for not also using libWrapper... smile...