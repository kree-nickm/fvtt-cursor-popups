# Cursor Popups

## Status
This module does not currently work on Foundry 0.8.0+. I do plan to update it, but not until I actually update to the latest 0.8 version myself and can actually test it, which I am holding off on until all the major mods I use are updated. Also, I am taking a break from GMing, so I haven't even looked to see what mods are compatible with 0.8 yet. Sorry for the inconveniece.

## Description
Causes a predetermined icon to appear at your cursor when you hold down a key, visible to all other players. Each player can select their desired keybind in the settings menu. This module is meant to replicate functionality seen in the MapTool VTT, such as players/GM putting a speech bubble on their character to show who is talking, or using an arrow to show where their character is looking, etc.

By default, `T` activates the speech bubble, and `Y` activates the arrow.

Pressing the key replaces the normal player cursors that are usually visible, so those must be enabled in order for a player to use this feature.

## Installation
In the Foundry VTT module manager, click the Install Module button and paste this URL into the Manifest URL box, then click Install: `https://raw.githubusercontent.com/kree-nickm/fvtt-cursor-popups/main/module.json`

## Future Changes
* Allow the GM to add their own popup icons, either through an image or by using the canvas drawing methods.

## Compatibility
Won't work with any module that overwrites `ControlsLayer.prototype.drawCursors` or `ControlsLayer.prototype.drawCursor` or `ControlsLayer.prototype.updateCursor` and will potentially not work properly with any module that changes the appearance of other players' cursors.
