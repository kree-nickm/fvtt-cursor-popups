"use strict";

Hooks.once("init", () => {
   game.settings.register("cursor-popups", "keyPress", {
      name: "Speech Bubble Key",
      hint: "The key you press to make the speech bubble appear.",
      scope: "client",
      config: true,
      default: "KeyT",
      type: String,
   });
   
   game.settings.register("cursor-popups", "showSelf", {
      name: "Show Your Own Bubble",
      hint: "Should your own bubble be shown?",
      scope: "client",
      config: true,
      default: false,
      type: Boolean,
   });
});

// canvasInit is the last hook that fires before ControlsLayer is drawn, so we edit the prototype now.
Hooks.once("canvasInit", () => {
   // Draws the speech bubble into the PIXI.Graphics object `graphics` with offset `x`,`y` and size multiplier `s`.
   function drawSpeechBubble(graphics, x=0, y=0, s=1)
   {
      graphics.beginFill(0xFFFFFF, 0.8).lineStyle(1, 0x000000, 1)
         .moveTo(x, y)
         .lineTo(x+6*s, y-13*s)
         .bezierCurveTo(x-20*s, y-35*s, x+46*s, y-67*s, x+90*s, y-40*s)
         .bezierCurveTo(x+125*s, y-18*s, x+61*s, y+15*s, x+18*s, y-6*s)
         .lineTo(x, y)
         .closePath();
   }
   
   // TODO: Every foundry update, check to make sure these ControlsLayer functions we are overwriting didn't change.
   ControlsLayer.prototype.drawCursors = function()
   {
      if(this.cursors)
      {
         this.cursors.destroy({children: true});
         this.cursors = null;
      }
      this.cursors = this.addChild(new PIXI.Container());
      for (let u of game.users.entities.filter(u => u.active && (u._id !== game.user._id || game.settings.get("cursor-popups", "showSelf"))))
      {
         let cursor = this.drawCursor(u);
         cursor.dot = cursor.children[0];
         cursor.name = cursor.children[1];
         cursor.speechBubble = cursor.addChild(new PIXI.Graphics());
         drawSpeechBubble(cursor.speechBubble, 0, 0, 2);
         cursor.dot.visible = u !== game.user;
         cursor.name.visible = u !== game.user;
         cursor.speechBubble.visible = false;
      }
   };
   
   ControlsLayer.prototype.updateCursor = function(user, position) {
      if (!this.cursors)
         return;
      const cursor = this._cursors[user._id] || this.drawCursor(user);

      // Ignore cursors on other Scenes
      if((position === null) || (user.viewedScene !== canvas.scene._id))
      {
         if(cursor)
            cursor.visible = false;
         return;
      }

      // Ignore cursors for users who are not permitted to share
      if(user === game.user && !game.settings.get("cursor-popups", "showSelf") || !user.hasPermission("SHOW_CURSOR"))
      {
         if(cursor)
            cursor.visible = false;
         return;
      }

      // Show the cursor in its currently tracked position
      cursor.visible = true;
      cursor.target = {x: position.x || 0, y: position.y || 0};
   };
});

Hooks.once("ready", async () => {
   // There's a KeyboardManager class that handles Foundry's keybinds, but it's pretty much useless to modules. Maybe one day it will be worthwhile.
   window.addEventListener("keydown", event => {
      // Make sure we aren't typing into a text field or something.
      if(event.target.nodeName === "BODY")
      {
         let keys = game.settings.get("cursor-popups", "keyPress").split("+");
         if(event.code === keys[keys.length-1]
            && (keys.indexOf("Shift") == -1 || event.shiftKey)
            && (keys.indexOf("Control") == -1 || event.ctrlKey)
            && (keys.indexOf("Alt") == -1 || event.altKey)
            && (keys.indexOf("Meta") == -1 || event.metaKey))
         {
            event.stopPropagation();
            event.preventDefault();
            game.user.update({showSpeechBubble:true});
         }
      }
   });
   
   window.addEventListener("keyup", event => {
      // Check to see if we even need to update before executing any further code.
      if(game.user.data.showSpeechBubble)
      {
         let keys = game.settings.get("cursor-popups", "keyPress").split("+");
         if(event.code === keys[keys.length-1])
         {
            game.user.update({showSpeechBubble:false});
         }
      }
   });
});

Hooks.on("updateUser", async (user, data, options, userId) => {
   // If the speech bubble isn't being toggled, we don't need to do anything.
   if(data.hasOwnProperty("showSpeechBubble"))
   {
      if(data.showSpeechBubble)
      {
         if(canvas.controls._cursors[userId])
         {
            canvas.controls._cursors[userId].dot.visible = false;
            canvas.controls._cursors[userId].name.visible = false;
            canvas.controls._cursors[userId].speechBubble.visible = true;
         }
         else
         {
            console.warn("Current user has no cursor.");
         }
      }
      else
      {
         if(canvas.controls._cursors[userId])
         {
            canvas.controls._cursors[userId].dot.visible = user !== game.user;
            canvas.controls._cursors[userId].name.visible = user !== game.user;
            canvas.controls._cursors[userId].speechBubble.visible = false;
         }
      }
   }
});

Hooks.on("canvasReady", async () => {
   let lastCursor = Date.now();
   canvas.stage.on("mousemove", event => {
      if(game.settings.get("cursor-popups", "showSelf"))
      {
         // Throttle cursor position updates to 100ms per tick
         let now = Date.now();
         if ((now - lastCursor) < 100) return;
         lastCursor = now;
         
         let coords = event.data.getLocalPosition(canvas.controls);
         if(coords)
            canvas.controls.updateCursor(game.user, coords);
         //else
         //   console.log(event.data);
      }
   });
});

// Set up the keybind field(s) to function like traditional keybind options instead of text fields.
Hooks.on("renderSettingsConfig", async () => {
   let keyPress = $("#config-tabs input[name='cursor-popups.keyPress']");
   keyPress[0].placeholder = "Press Desired Key";
   keyPress.keydown(event => {
      event.stopPropagation();
      event.preventDefault();
      if(event.key == "Shift" || event.key == "Control" || event.key == "Alt" || event.key == "Meta")
      {
      }
      else
      {
         let key = event.code;
         if(event.shiftKey)
            key = "Shift+"+key
         if(event.ctrlKey)
            key = "Ctrl+"+key
         if(event.altKey)
            key = "Alt+"+key
         if(event.metaKey)
            key = "Meta+"+key
         $(event.currentTarget).val(key).blur();
      }
   });
   keyPress.focus(event => {
      event.currentTarget.defaultValue = event.currentTarget.value;
      event.currentTarget.value = "";
   });
   keyPress.blur(event => {
      if(event.currentTarget.value == "")
      {
         event.currentTarget.value = event.currentTarget.defaultValue;
      }
   });
});
