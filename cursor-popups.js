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

// Note: Every Foundry VTT update, check to make sure these three functions we are overwriting didn't change in a way that we care about.
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
      this.drawCursor(u);
   }
};

ControlsLayer.prototype.drawCursor = function(user)
{
   if(user._id in this._cursors)
   {
      this._cursors[user._id].destroy({children: true});
      delete this._cursors[user._id];
   }
   let cursor = this._cursors[user._id] = this.cursors.addChild(new Cursor(user));
   cursor.dot = cursor.children[0];
   cursor.name = cursor.children[1];
   for(let icon of cursorIcons)
   {
      cursor[`icon${icon.slug}`] = cursor.addChild(new PIXI.Graphics());
      icon.draw(cursor[`icon${icon.slug}`], 0, 0, game.settings.get("cursor-popups", "size"));
      cursor[`icon${icon.slug}`].visible = false;
   }
   cursor.dot.visible = user !== game.user;
   cursor.name.visible = user !== game.user;
   return cursor;
}

ControlsLayer.prototype.updateCursor = function(user, position)
{
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

Cursor.prototype._oldAnimate = Cursor.prototype._animate;
Cursor.prototype._animate = function()
{
   if(!this.dot || this.dot.visible)
      this._oldAnimate();
   else
   {
      let easing = game.settings.get("cursor-popups", "easing");
      let dx = this.target.x - this.x;
      let dy = this.target.y - this.y;
      let edx = dx / easing;
      let edy = dy / easing;
      let minMove = 10 / easing;
      let dist2 = dx*dx + dy*dy;
      let edist2 = edx*edx + edy*edy;
      if(edist2 >= minMove*minMove)
      {
         this.x += edx;
         this.y += edy;
      }
      else
      {
         let factor = Math.sqrt(edist2 / (minMove*minMove));
         if(factor > 0.1)
         {
            this.x += factor*edx;
            this.y += factor*edy;
         }
         else
         {
            this.x = this.target.x;
            this.y = this.target.y;
         }
      }
   }
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
      default: true,
      type: Boolean,
   });
   
   game.settings.register("cursor-popups", "easing", {
      name: "Movement Easing",
      hint: "How much smoothing should be applied to cursor movement.",
      scope: "client",
      config: true,
      range: {
         min: 1,
         max: 10,
         step: 1
      },
      default: 5,
      type: Number,
   });
   
   game.settings.register("cursor-popups", "size", {
      name: "Popup Size",
      hint: "Size multiplier for the icons.",
      scope: "client",
      config: true,
      range: {
         min: 0.1,
         max: 3,
         step: 0.1
      },
      default: 2,
      type: Number,
      onChange: (val) => {
         canvas.controls.drawCursors();
      },
   });
});

// TODO: Rarely, someone's mouse cursor can be desynced. Try to add some code to rectify that when an icon button is pressed.
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
               canvas.controls._cursors[userId].name.visible = true;
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
