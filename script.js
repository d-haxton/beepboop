// ==UserScript==
// @name         BEEP BOOP MOTHERFUCKER
// @author       d-haxton
// @version      4.3
// @match        *://krunker.io/*
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

//default keys
var keys;
(function (keys) {
    keys["one"] = "I";
    keys["two"] = "J";
    keys["three"] = "L";
    keys["four"] = "U";
    keys["five"] = "H";
    keys["six"] = "G";
    keys["seven"] = "K";
    keys["eight"] = "T";
    keys["nine"] = "O";
    keys["ten"] = "B";
})(keys || (keys = {}));

class Module {
    constructor() {
        this.allModes = this.getAllModes();
        this.currentModeIndex = this.allModes.indexOf(this.getInitialMode());
    }
    getInitialMode() {
        return this.allModes[0];
    }
    onModeChanged() {
    }
    onTick() {
    }
    onKeyPressed() {
        this.currentModeIndex++;
        if (this.currentModeIndex >= this.allModes.length) {
            this.currentModeIndex = 0;
        }
        this.onModeChanged();
    }
    isEnabled() {
        return this.currentModeIndex !== 0;
    }
    getStatus() {
        return this.allModes[this.currentModeIndex].toString();
    }
    getCurrentMode() {
        return this.allModes[this.currentModeIndex];
    }
}

class Aimbot extends Module {
    constructor() {
        super(...arguments);
        this.scopingOut = false;
        this.canShoot = true;
        this.spinTicks = 0;
    }
    getName() {
        return 'Aimbot';
    }
    getKey() {
        return '' + keys.one + '';
    }
    getAllModes() {
        return ["Off", "On", "360"];
    }
    onTick() {
        if (!this.players) {
            return;
        }

        const possibleTargets = this.players
            .filter(player => {
                if (unsafeWindow.aimwaller == true) {
                    return player.active && !player.isYou && (!player.team || player.team !== this.me.team);
                } else {
                    return player.active && player.inView && !player.isYou && (!player.team || player.team !== this.me.team);
                }
            })
            .sort((p1, p2) => this.distance(this.me, p1) - this.distance(this.me, p2));
        let isLockedOn = false;
        if (possibleTargets.length > 0) {
            const target = possibleTargets[0];
            switch (this.getCurrentMode()) {
                case "On":
                    isLockedOn = this.runQuickscoper(target, 0);
                    break;
                case "360":
                    isLockedOn = this.runQuickscoper(target, 3);
                    break;
            }
        }
        else
        {
            this.spinTicks = 0;
        }
        if (!isLockedOn) {
            this.control.camLookAt(null);
            this.control.target = null;
            if (this.getCurrentMode() === "On" || this.getCurrentMode() == "360") {
                this.control.mouseDownL = 0;
                this.control.mouseDownR = 0;
            } 
        }
    }
    runQuickscoper(target, ticks) {
        if (this.me.didShoot) {
            this.canShoot = false;
            setTimeout(() => {
                this.canShoot = true;
            }, this.me.weapon.rate / 1.85);
        }

        if (this.control.mouseDownL === 1) {
            this.control.mouseDownL = 0;
            this.control.mouseDownR = 0;
            this.scopingOut = true;
        }
        if (this.me.aimVal === 1) {
            this.scopingOut = false;
        }

        if (this.scopingOut || !this.canShoot) {
            return false;
        }
        
        if(ticks > 0)
        {
            this.spinTicks = this.spinTicks + 1;
            unsafeWindow.control.object.rotation.y -= 4;
            unsafeWindow.control.yDr -= 4;

            unsafeWindow.control.xDr -= 4;
            unsafeWindow.control.xVel -= 6.2;
        }
        
        if (this.spinTicks < ticks || this.me.recoilForce > 0.01)
        {
            return false;
        }
        
        if (this.control.mouseDownR === 0) {
            this.control.mouseDownR = 1;
        }
        if (this.me.aimVal < 0.1) {
            this.lookAt(target);
            this.control.mouseDownL = 1 - this.control.mouseDownL;
            this.spinTicks = 0;
        }
        return true;
    }

    lookAt(target) {
        this.control.camLookAt(target.x2, target.y2 + target.height - 1.4 - 2.4 * target.crouchVal, target.z2);
    }

    distance(player1, player2) {
        const dx = player1.x - player2.x;
        const dy = player1.y - player2.y;
        const dz = player1.z - player2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
}

class AutoBHop extends Module {
    constructor() {
        super(...arguments);
        this.isSliding = false;
    }
    getName() {
        return 'Auto BHop';
    }
    getKey() {
        return '' + keys.ten + '';
    }
    getAllModes() {
        return ["Off" /* Off */ , "Jump" /* Jump */ , "Slide Jump" /* SlideJump */ ];
    }
    onTick() {
        this.control.keys[32] = !this.control.keys[32];
        if (this.getCurrentMode() === "Slide Jump" /* SlideJump */ ) {
            if (this.isSliding) {
                this.inputs[8] = 1;
                return;
            }
            if (this.me.yVel < -0.04 && this.me.canSlide) {
                this.isSliding = true;
                setTimeout(() => {
                    this.isSliding = false;
                }, 350);
                this.inputs[8] = 1;
            }
        }
    }
}

class AutoWeaponSwap extends Module {
    getName() {
        return 'Auto Weapon Swap';
    }
    getKey() {
        return '' + keys.five + '';
    }
    getAllModes() {
        return ["Off" /* Off */ , "On" /* On */ ];
    }
    getInitialMode() {
        return "Off" /* Off */ ;
    }
    onTick() {
        if (this.me.ammos[this.me.weaponIndex] === 0 && this.me.ammos[0] != this.me.ammos[1]) {
            this.inputs[10] = -1
        }
    }
}

var AimwallMode;
(function (AimwallMode) {
    AimwallMode["On"] = "ON";
    AimwallMode["Off"] = "OFF";
})(AimwallMode || (AimwallMode = {}));
class AimWalls extends Module {
    getName() {
        return 'Aim Through Walls';
    }
    getKey() {
        return '' + keys.four + '';
    }
    getAllModes() {
        return [AimwallMode.Off, AimwallMode.On];
    }
    getInitialMode() {
        unsafeWindow.aimwaller = false;
        return AimwallMode.Off;
    }
    onModeChanged() {
        unsafeWindow.aimwaller = this.getCurrentMode() === AimwallMode.On;
    }
}

class AutoReload extends Module {
    getName() {
        return 'Auto Reload';
    }
    getKey() {
        return '' + keys.two + '';
    }
    getAllModes() {
        return ["Off" /* Off */ , "On" /* On */ ];
    }
    getInitialMode() {
        return "On" /* On */ ;
    }
    onTick() {
        if (this.me.ammos[this.me.weaponIndex] === 0) {
            this.inputs[9] = 1;
        }
    }
}

const cache = {};
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function generateString() {
    let str = '';
    for (let i = 0; i < 7; i++) {
        str += characters[Math.floor(Math.random() * characters.length)];
    }
    return str;
}

function getRandomizedName(original) {
    if (!cache[original]) {
        cache[original] = generateString();
    }
    return cache[original];
}

class bigdickjesusland {
    constructor() {
        this.modules = [];
        this.values = 'BEEP BOOP MOTHERFUCKER';
    }
    init() {
        this.modules.push(new Aimbot());
        this.modules.push(new AutoReload());
        this.modules.push(new AimWalls());
        this.modules.push(new AutoBHop());
        const initInfoBoxInterval = setInterval(() => {
            if (this.canInjectInfoBox()) {
                clearInterval(initInfoBoxInterval);
                this.injectInfoBox();
                this.updateInfoBox();
            }
        }, 100);
    }
    onTick(me, inputs) {
        this.modules.forEach(module => {
            if (module.isEnabled()) {
                module.me = me;
                module.inputs = inputs;
                module.control = unsafeWindow.control;
                module.players = unsafeWindow.players;
                module.onTick();
            }
        });
    }
    onKeyPressed(e) {
        let shouldUpdateInfoBox = false;
        this.modules.forEach(module => {
            if (module.getKey().toUpperCase() === e.key.toUpperCase()) {
                module.onKeyPressed();
                shouldUpdateInfoBox = true;
            }
        });
        if (shouldUpdateInfoBox) {
            this.updateInfoBox();
        }
    }
    updateInfoBox() {
        const infoBox = unsafeWindow.document.querySelector('#bigdickjesuslandInfoBox');
        if (infoBox === null) {
            return;
        }
        const moduleLines = this.modules.map(module => {
            return `
        <div class="leaderItem">
          <div class="leaderNameF">[${module.getKey().toUpperCase()}] ${module.getName()}</div>
          <div class="leaderScore">${module.getStatus()}</div>
        </div>
      `;
        });
        infoBox.innerHTML = `
      <div class="bigdickjesuslandTitle">${this.values}</div>
      ${moduleLines.join('')}
    `.trim();
    }
    injectInfoBox() {
        const infoBox = unsafeWindow.document.createElement('div');
        infoBox.innerHTML = `
      <div>
        <style>
          #bigdickjesuslandInfoBox {
            text-align: left;
            width: 310px;
            z-index: 3;
            padding: 10px;
            padding-left: 20px;
            padding-right: 20px;
            color: rgba(255, 255, 255, 0.7);
            line-height: 25px;
            margin-top: 20px;
            background-color: rgba(0, 0, 0, 0.2);
          }
          #bigdickjesuslandInfoBox .bigdickjesuslandTitle {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            color: #fff;
            margin-top: 5px;
            margin-bottom: 5px;
          }
          #bigdickjesuslandInfoBox .leaderItem {
           font-size: 14px;
          }
        </style>
        <div id="bigdickjesuslandInfoBox"></div>
      </div>
    `.trim();
        const leaderDisplay = unsafeWindow.document.querySelector('#leaderDisplay');
        leaderDisplay.parentNode.insertBefore(infoBox.firstChild, leaderDisplay.nextSibling);
    }
    canInjectInfoBox() {
        return unsafeWindow.document.querySelector('#leaderDisplay') !== null;
    }
}

// tslint:disable no-console
class Logger {
    constructor(prefix) {
        this.prefix = prefix;
    }
    log(...message) {
        console.log(this.prefix, ...message);
    }
    error(...message) {
        console.error(this.prefix, ...message);
    }
    crash(message) {
        document.open();
        document.write(`Dude I don't know. Something happened.`);
        document.close();
        throw new Error(`${this.prefix} ${message}`);
    }
}
const logger = new Logger('[bigdickjesusland]');

function applyPatch(script, method, regex, replacer) {
    const newScript = script.replace(regex, replacer);
    if (script === newScript) {
        logger.crash(`${method} was not successful`);
    }
    return newScript;
}

function patchControl(script) {
    return applyPatch(script, 'patchControl', /var ([a-zA-Z0-9_])+=this;this.gamepad=new i/, ($0, $1, $2, $3) => {
        return `var ${$1} = window.control = this;this.gamepad=new i`;
    });
}

function patchPlayers(script) {
    return applyPatch(script, 'patchPlayers', /if\(this\.now/, 'window.players = this.players.list; if (this.now');
}

function patchOnKeyPressed(script) {
    return applyPatch(script, 'patchOnKeyPressed', /"keyup",([a-zA-Z0-9_]+)/, ($0, $1) => {
        return `
      "keyup", function (t, e) {
        if (document.activeElement !== chatInput) {
          window.${getRandomizedName('onKeyPressed')}(t);
        } ${$1}(t, e);
      }
    `;
    });
}

function patchForAimbot(script) {
    return applyPatch(script, 'patchForAimbot', /{if\(this\.target\){([^}]+)}},this.([a-zA-Z0-9_]+)=/, ($0, $1, $2) => {
        return `
      {
        if (this.target) {
            this.object.rotation.y = this.target.yD;
            this.pitchObject.rotation.x = this.target.xD;
            this.pitchObject.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitchObject.rotation.x));
            this.yDr = this.pitchObject.rotation.x % Math.PI2;
            this.xDr = this.object.rotation.y % Math.PI2;
          ${$1}
        }
      }, this.camLookAt = this.${$2} =
    `;
    });
}

function patchForWallHack(script) {
    return applyPatch(script, 'patchForWallHack', /\(!tmpObj.inView\)/, `(false)`);
}

function patchOnTick(script) {
    return applyPatch(script, 'patchOnTick', /,([a-zA-Z0-9]+)\.procInputs\(([a-zA-Z0-9_]+)/, ($0, $1, $2) => {
        return `, window.${getRandomizedName('onTick')}(${$1}, ${$2}), ${$1}.procInputs(${$2}`;
    });
}

function patchIsHacker(script) {
    var x = applyPatch(script, 'patchIsHacker', /&&([a-zA-Z0-9_]+)\.isHacker&&/, `&& 1 === 0 &&`);
    x = applyPatch(x, 'patchLastHack1', /&&([a-zA-Z0-9_]+)\.lastHack&&/, `&& 1 === 0 &&`);
    x = applyPatch(x, 'patchLastHack2', /var n=r.([a-zA-Z0-9]+)\(\[t,e\],this.ahNum\);this.([a-zA-Z0-9]+).send\(n\)/, ($0, $1, $2) => 
    {
        return `var n=r.${$1}([t,e],this.ahNum);if(t!=="loadin")this.${$2}.send(n);else{this.${$2}.send(r.${$1}(["checkin",e],this.ahNum));}`;
    });
    return applyPatch(x, 'patchIsHacker', /window.kiH\(M\)/, ``);
}

function patchCamera(script) {
    return applyPatch(script, 'patchCamera', /t.camera.rotation.set\(0,0,0\),/, `window.${getRandomizedName('camera')} = t.camera,t.camera.rotation.set(0,0,0),`)
}

function patchGameScript(script) {
    logger.log('Patching the game script...');
    script = patchControl(script);
    script = patchPlayers(script);
    script = patchOnTick(script);
    script = patchOnKeyPressed(script);
    script = patchForAimbot(script);
    script = patchForWallHack(script);
    script = patchIsHacker(script);
    script = patchCamera(script);
    logger.log('Successfully patched the game script!');
    return script;
}

function request(url) {
    return new Promise(resolve => {
        logger.log(`Retrieving ${url}`);
        GM_xmlhttpRequest({
            url,
            method: 'GET',
            onload: (response) => resolve(response.responseText),
        });
    });
}

function replaceRemoteScriptWithInline(html, partialSrc, script) {
    const inline = `<script type="text/javascript">${script}</script>`;
    const regExp = new RegExp(`<script src="[^"]*${partialSrc}[^"]*"></script>`);
    return html.replace(regExp, `<script src="${partialSrc}"></script>`) + inline;
}

async function inlineRemoteScript(html, partialSrc) {
    const regExp = new RegExp(`<script src="([^"]*)${partialSrc}([^"]*)"></script>`);
    const [, prefix, suffix] = regExp.exec(html);
    const script = await request(prefix + partialSrc + suffix);
    return replaceRemoteScriptWithInline(html, partialSrc, script);
}


(async () => {
    window.stop();
    logger.log('Loading bigdickjesusland...');
    let newHtml = await request(document.location.href);
    const gameScriptHash = /game\.([^\.]+)\.js/.exec(newHtml)[1];
    const gameScript = await request(`https://krunker.io/js/game.${gameScriptHash}.js`);
    newHtml = await inlineRemoteScript(newHtml, 'libs/zip.js');
    newHtml = await inlineRemoteScript(newHtml, 'libs/zip-ext.js');
    newHtml = replaceRemoteScriptWithInline(newHtml, `js/game`, patchGameScript(gameScript));
    const bot = new bigdickjesusland();
    bot.init();
    unsafeWindow[getRandomizedName('onTick')] = (me, inputs) => bot.onTick(me, inputs);
    unsafeWindow[getRandomizedName('onKeyPressed')] = (e) => bot.onKeyPressed(e);
    document.open();
    document.write(newHtml);
    document.close();
    logger.log('Successfully loaded bigdickjesusland!');
})();