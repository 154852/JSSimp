const SMPL = {};

SMPL.webCall = function(url, callback, method, type) {
    const request = new XMLHttpRequest();
    request.onload = callback;
    request.open(method == null? 'GET':method, url);
    if (type) request.responseType = type;
    request.send();
    return request;
}

SMPL.thread = function(callback) {
    callback();
}

SMPL.insertGroups = function(string, match) {
    for (var i = 0; i < match.length; i++) {
        string = string.replace('$' + i, match[i]);
    }

    return string;
}

SMPL.setCursorPos = function(element, position) {
    var sel = window.getSelection();

    var range = document.createRange();
    range.setStart(element, position);
    range.collapse(true);

    sel.removeAllRanges();
    sel.addRange(range);
}

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

String.prototype.replace = function(a, b) {
    if (a.constructor.name == 'RegExp') {
        var match;
        var end = this;
        do {
            match = a.exec(this);
            if (match != null) {
                const index = end.indexOf(match[0]);
                end = end.substring(0, index) + SMPL.insertGroups(b, match) + end.substring(index + match[0].length);
            }
        } while (match != null);

        return end;
    } else {
        return this.split(a).join(b);
    }
}

String.prototype.indentation = function(index) {
    var start = 0;
    for (var i = index; i > -1; i--) {
        start = i;
        if (this.charAt(i) == '\n') {
            start += 1;
            break;
        }
    }
    
    const nString = this.substring(start, index);

    var found = 0;
    for (var i = 0; i < nString.length; i++) {
        const char = nString.charAt(i);
        if (char == '\t' || char == ' ') found += 1;
        else break;
    }
    return found;
}

String.prototype.pad = function(amount) {
    return ' '.repeat(amount) + this + ' '.repeat(amount);
}

String.prototype.replaceMap = function(map) {
    var end = this;
    for (const key in map) {
        end = end.replace(key, map[key]);
    }
    return end;
}

String.prototype.replaceArray = function(array, sub) {
    var end = this;
    for (const item of array) {
        end = end.replace(item, sub);
    }
    return end;
}

SMPL.color = function(text) {
    text = text.pad(1).replace(/"[^"]*"/g, '<span class="str">$0</span>');
    text = text.pad(1).replace(/'[^']*'/g, '<span class="str">$0</span>');
    text = text.pad(1).replace(/\/\/.*/gm, '<span class="co">$0</span>');
    text = text.pad(1).replace(/function/g, '<span class="name">$0</span>');
    text = text.pad(1).replace(/class(^=)/g, '<span class="name">class</span>$1');
    text = text.pad(1).replace(/([^a-z^A-Z])(return|true|false|contructor|this|var|const|await|async|null|undefined)([^a-z^A-Z])/g, '$1<span class="key">$2</span>$3');
    text = text.pad(1).replace(/([a-zA-Z0-9]+)( ?\()/g, '<span class="func">$1</span>$2');
    text = text.pad(1).replace(/([^a-z^A-Z])(-?\.?[0-9]+\.?[0-9]*\.?)/g, '$1<span class="num">$2</span>');

    return text.trim();
};

class SMPLContext {
    constructor() {
        const self = this;
        this.domElement = null;
        this.program = null;
        this.commands = [];
        this.commandIndex = 0;

        var output, input, lines;

        this.initBaseInputHandler = function() {
            self.inputHandler = function(text) {
                if (text.trim() != '') {
                    this.rawprint(SMPL.color(text)).classList.add('code');
                    self.commands.push(text);
                    self.commandIndex = self.commands.length;
                }
                try {
                    if (text.startsWith('|')) {
                        text = text.substring(1, text.length);
                        text = new AsyncFunction(text)();
                    } else if (text.startsWith('>')) {
                        text = text.substring(1, text.length);
                        text = new Function(text)();
                    } else {
                        text = eval(text);
                    }

                    if (typeof text == 'object') {
                        text = JSON.stringify(text);
                    }

                    if (text == null) this.rawprint('<span style="color: black">>> </span>' + text, 'grey');
                    else this.print(SMPL.color(text.toString()));
                } catch (exception) {
                    this.error(exception);
                }
            }

            input.style.color = '';
            input.className = 'code';
        }

        this.updateLines = function() {
            for (var i = 0; i < (output.children.length - lines.children.length); i++) {
                const div = document.createElement('div');
                div.innerHTML = lines.children.length + 1;
                lines.appendChild(div);
            }
        }

        this.generateDom = function(callback) {
            SMPL.webCall('/src/domElement.html', function() {
                self.domElement = document.createElement('div');
                self.domElement.innerHTML = this.responseText;
                self.domElement = self.domElement.children[0];

                input = self.domElement.querySelector('#smpl-input');
                output = self.domElement.querySelector('#smpl-console');
                lines = self.domElement.querySelector('#lines');
        
                output.addEventListener('click', function() {
                    input.focus();
                });

                self.domElement.querySelector('#back-to-top').addEventListener('click', function() {
                    window.scrollTo(0, 0);
                });
        
                input.addEventListener('keydown', function(event) {
                    self.updateLines();

                    var sel = window.getSelection();
                    const offset = sel.anchorOffset;

                    const dontEnd = ')\'"]}'
                    for (const dontEndEl of dontEnd) {
                        if (event.key == dontEndEl && input.innerHTML.charAt(offset) == dontEndEl) {
                            SMPL.setCursorPos(sel.anchorNode == input? input.childNodes[0]:sel.anchorNode, offset + 1);
                            event.preventDefault();
                            return;
                        }
                    }

                    const finish = ['()', '{}', '[]', '""', '\'\''];
                    for (const toFinish of finish) {
                        if (event.key == toFinish.charAt(0)) {
                            input.innerHTML = input.innerHTML.replace('&nbsp;', '\t');
                            input.innerHTML = input.innerHTML.substring(0, offset) + toFinish + input.innerHTML.substring(offset);
                            input.innerHTML = input.innerHTML.replace('\t', '&nbsp;');
    
                            SMPL.setCursorPos(sel.anchorNode == input? input.childNodes[0]:sel.anchorNode, offset + 1);
    
                            event.preventDefault();
                            return;
                        }
                    }
                    if (event.keyCode == 13 || event.which == 13) {
                        if (!event.shiftKey) {
                            self.inputHandler(input.innerText);
                            input.innerHTML = '';
                            event.preventDefault();
                            return;
                        } else self.updateLines();
                    }

                    if (event.keyCode == 9 || event.which == 9) {
                        event.preventDefault();

                        input.innerHTML = input.innerHTML.replace('&nbsp;', '\t');
                        input.innerHTML = input.innerHTML.substring(0, offset) + '\t' + input.innerHTML.substring(offset);
                        input.innerHTML = input.innerHTML.replace('\t', '&nbsp;');

                        SMPL.setCursorPos(sel.anchorNode == input? input.childNodes[0]:sel.anchorNode, offset + 1);
                        return;
                    }

                    if (!input.innerHTML.trim().startsWith('|') && !input.innerHTML.trim().startsWith('>')) {
                        if (event.keyCode == 38) {
                            if (self.commandIndex > 0) {
                                self.commandIndex -= 1;
                                input.innerHTML = self.commands[self.commandIndex];
                            }
                            return;
                        }
    
                        if (event.keyCode == 40) {
                            if (self.commandIndex < self.commands.length - 1) {
                                self.commandIndex += 1;
                                input.innerHTML = self.commands[self.commandIndex];
                            } else {
                                input.innerHTML = '';
                            }
                            return;
                        }
                    }
                });
        
                self.initBaseInputHandler();
                callback(self.domElement);
            }, 'GET');
        }

        this.callbackInput = function(callback) {
            input.className = 'input';

            self.inputHandler = function(text) {
                this.rawprint(text).classList.add('input');
                this.initBaseInputHandler();
                callback(text);
            }
        }

        this.input = function(color) {
            if (color != null) input.style.color = color;
            else input.className = 'input';

            var string = null;

            self.inputHandler = function(text) {
                if (text.trim() != '') {
                    const element = this.rawprint(text);

                    if (color != null) element.style.color = color;
                    else element.className = 'input';
                }
                this.initBaseInputHandler();
                string = text;
            }
        
            return new Promise(function(resolve) {
                const interval = setInterval(function() {
                    if (string != null) {
                        clearInterval(interval);
                        resolve(string);
                    }
                }, 100);
            });
        }

        this.print = function(text, color) {
            return self.rawprint('<span style="color: black">>> </span> ' + text, color);
        }

        this.log = function(text1, text2) {
            return self.rawprint('<span style="color: #1F618D">' + text1 + (text2 == null? '':':') + '</span> ' + (text2 == null? '':text2));
        }

        this.error = function(text) {
            return self.rawprint('>> ' + text, 'red');
        }

        this.rawprint = function(text, color) {
            const div = document.createElement('div');
            if (color != null) div.style.color = color;
            div.innerHTML = text.replace('\n', '<br />');
            output.insertBefore(div, input);

            self.updateLines();
            window.scrollTo(0, document.body.scrollHeight);

            return div;
        }

        this.clear = function() {
            output.innerHTML = '';
            output.appendChild(input);
            input.focus();
        }

        this.overwrite = function() {
            console.log = self.print;
            console.error = self.error;
            console.input = self.forceInput;
            window.clear = self.clear;
        }

        this.runProgram = function(program, name) {
            this.log('Started program', name);
            this.program = {func: program, name: name};
            
            program.call({
                ctx: self,
                breakpoint: async function() {
                    self.log('Started breakpoint mode for', name);

                    var text = '';
                    while (text != 'exit') {
                        text = await self.forceInput('#D35400');
                        if (text != 'exit') self.log('Data stored in "' + text + '"',  SMPL.color(this[text] + ''));
                    }

                    self.log('Exited breakpoint mode for', name);

                    resolve(true);
                }
            })
        }

        this.start = function() {
            this.runProgram(this.program.func, this.program.name);
        }
    }
}

function simpler(program, name, overwrite, info) {
    const context = new SMPLContext();
    if (overwrite != false) context.overwrite();

    context.generateDom(function(node) {
        document.body.appendChild(node);
        if (info != false) {
            context.log('Current date', new Date().toString());
            context.log('Current path', window.location.href);
        }

        context.runProgram(program, name == null? 'root':name);
    });

    return context;
}