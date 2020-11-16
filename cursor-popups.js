"use strict";

const cursorIcons = [
   {
      name: "Speech Bubble",
      default: "KeyT",
      draw: function(g, x=0, y=0, s=1)
      {
         g.beginFill(0xFFFFFF, 0.8).lineStyle(1, 0x000000, 1)
            .moveTo(x, y)
            .lineTo(x+6*s, y-13*s)
            .bezierCurveTo(x-20*s, y-35*s, x+46*s, y-67*s, x+90*s, y-40*s)
            .bezierCurveTo(x+125*s, y-18*s, x+61*s, y+15*s, x+18*s, y-6*s)
            .lineTo(x, y)
            .closePath();
      },
   },
   {
      name: "Arrow",
      default: "KeyY",
      draw: function(g, x=0, y=0, s=1)
      {
         g.beginFill(0xFFFFFF, 0.8).lineStyle(1, 0x000000, 1)
            .moveTo(x, y)
            .lineTo(x+15*s, y-18*s)
            .lineTo(x+7*s, y-18*s)
            .lineTo(x+7*s, y-50*s)
            .lineTo(x-7*s, y-50*s)
            .lineTo(x-7*s, y-18*s)
            .lineTo(x-15*s, y-18*s)
            .lineTo(x, y)
            .closePath();
      },
   },
];

// TODO: Every Foundry VTT update, check to make sure these ControlsLayer functions we are overwriting didn't change.
ControlsLayer.prototype.drawCursors = function()
{
   if(this.cursors)
   {
      this.cursors.destroy({children: true});
      this.cursors = null;
   }
   this.cursors = this.addChild(new PIXI.Container());
   for (let u of game.users.entities.filter(u => u.active))
   {
      let cursor = this.drawCursor(u);
      cursor.dot = cursor.children[0];
      cursor.name = cursor.children[1];
      for(let icon of cursorIcons)
      {
         cursor[`icon${icon.slug}`] = cursor.addChild(new PIXI.Graphics());
         icon.draw(cursor[`icon${icon.slug}`], 0, 0, 2);
         cursor[`icon${icon.slug}`].visible = false;
      }
      cursor.dot.visible = u !== game.user;
      cursor.name.visible = u !== game.user;
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

Hooks.once("init", () => {
   for(let icon of cursorIcons)
   {
      icon.slug = icon.name.slugify("", true);
      game.settings.register("cursor-popups", `${icon.slug}Key`, {
         name: `${icon.name} Key`,
         hint: `The key you press to make the ${icon.name.toLowerCase()} appear.`,
         scope: "client",
         config: true,
         default: icon.default,
         type: String,
      });
   }
   
   game.settings.register("cursor-popups", "showSelf", {
      name: "Show Your Own Icon?",
      hint: "Should your own icons be shown to you?",
      scope: "client",
      config: true,
      default: false,
      type: Boolean,
   });
});

Hooks.once("ready", async () => {
   // There's a KeyboardManager class that handles Foundry's keybinds, but it's pretty much useless to modules.
   window.addEventListener("keydown", event => {
      // Make sure we aren't typing into a text field or something.
      if(event.target.nodeName === "BODY")
      {
         for(let icon of cursorIcons)
         {
            let key = game.settings.get("cursor-popups", `${icon.slug}Key`).split("+");
            if(event.code === key[key.length-1]
               && (key.indexOf("Shift") == -1 || event.shiftKey)
               && (key.indexOf("Control") == -1 || event.ctrlKey)
               && (key.indexOf("Alt") == -1 || event.altKey)
               && (key.indexOf("Meta") == -1 || event.metaKey))
            {
               event.stopPropagation();
               event.preventDefault();
               game.user.update({[`show${icon.slug}`]:true});
            }
         }
      }
   });
   
   window.addEventListener("keyup", event => {
      for(let icon of cursorIcons)
      {
         if(game.user.data[`show${icon.slug}`])
         {
            let keys = game.settings.get("cursor-popups", `${icon.slug}Key`).split("+");
            if(event.code === keys[keys.length-1])
            {
               game.user.update({[`show${icon.slug}`]:false});
            }
         }
      }
   });
});

Hooks.on("updateUser", async (user, data, options, userId) => {
   for(let icon of cursorIcons)
   {
      if(data.hasOwnProperty(`show${icon.slug}`))
      {
         if(data[`show${icon.slug}`])
         {
            if(canvas.controls._cursors[userId])
            {
               canvas.controls._cursors[userId].dot.visible = false;
               canvas.controls._cursors[userId].name.visible = false;
               for(let icon2 of cursorIcons)
                  canvas.controls._cursors[userId][`icon${icon2.slug}`].visible = false;
               canvas.controls._cursors[userId][`icon${icon.slug}`].visible = true;
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
               canvas.controls._cursors[userId][`icon${icon.slug}`].visible = false;
            }
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
         /*let now = Date.now();
         if ((now - lastCursor) < 100) return;
         lastCursor = now;*/
         
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
   let keyPress = $("#config-tabs input[name^='cursor-popups.']");
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
      event.currentTarget.value = "";
      event.currentTarget.placeholder = "Press Desired Key";
   });
   keyPress.blur(event => {
      if(event.currentTarget.value == "")
      {
         event.currentTarget.placeholder = "None";
      }
   });
});
