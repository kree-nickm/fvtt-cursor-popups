# Cursor Popups

Causes a predetermined icon to appear at your cursor when you hold down a key, visible to all other players. Each player can select their desired keybind in the settings menu. This module is meant to replicate functionality seen in the MapTool VTT, such as players/GM putting a speech bubble on their character to show who is talking, or using an arrow to show where their character is looking, etc.

Pressing the key replaces the normal player cursors that are usually visible, so those must be enabled in order for a player to use this feature.

## Future Changes
* Additional icons aside from just a speech bubble. MapTool also has a thought bubble, an arrow, and pointer finger. I at least want to add the arrow.
* Allow the GM to add their own popup icons, either through an image or by using the canvas drawing methods.
* Make the popup more responsive when it's visible. Right now the cursor doesn't follow the user's actual mouse movements, which is fine normally, but might get confusing if it results in the popup being in the wrong place.