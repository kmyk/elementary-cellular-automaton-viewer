import queryString = require('query-string');

class ElementaryCellularAutomaton {
    rule: [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];
    height: number;
    width: number;
    drawPixel: (y: number, x: number, color: string) => void;
    cell: boolean[][];
    currentLine: number;

    constructor(rule: [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean], drawPixel: (y: number, x: number, color: string) => void) {
        this.rule = rule;
        this.drawPixel = drawPixel;
        this.cell = [];
        this.currentLine = 0;
        this.resize(1, 1);
    }

    resize(height: number, width: number) {
        this.height = height;
        this.width = width;
        while (this.cell.length < height) {
            this.cell.push([]);
        }
        for (let y = 0; y < height; ++ y) {
            while (this.cell[y].length < width) {
                this.cell[y].push(false);
            }
        }
        this.setCurrentLine(this.currentLine);
    }

    step() {
        const previousLine = this.currentLine;
        if (this.currentLine + 1 < this.height) {
            this.currentLine += 1;
        } else {
            this.currentLine = 0;
            this.setCurrentLine(0);
        }
        for (let x = 0; x < this.width; ++ x) {
            let i = 0;
            if (x - 1 >= 0 && this.cell[previousLine][x - 1]) {
                i += 4;
            }
            if (this.cell[previousLine][x]) {
                i += 2;
            }
            if (x + 1 < this.width && this.cell[previousLine][x + 1]) {
                i += 1;
            }
            this.cell[this.currentLine][x] = this.rule[i];
        }
        for (let x = 0; x < this.width; ++ x) {
            this.drawPixel(this.currentLine, x, (this.cell[this.currentLine][x] ? 'black' : 'white'));
        }
    }

    flipCell(y: number, x: number) {
        this.cell[y][x] = ! this.cell[y][x];
        this.drawPixel(y, x, (this.cell[y][x] ? 'black' : 'white'));
    }

    setCurrentLine(y: number) {
        this.currentLine = Math.min(this.height - 1, y);
        for (let y = 0; y < this.height; ++ y) {
            const color = (y == this.currentLine ? 'black' : 'grey');
            for (let x = 0; x < this.width; ++ x) {
                this.drawPixel(y, x, (this.cell[y][x] ? color : 'white'));
            }
        }
    }
}


window.addEventListener('DOMContentLoaded', () => {
    const config = queryString.parse(location.search);
    console.log(config);
    console.log(config.hasOwnProperty);
    config.updated = false;
    if (! ('rule' in config)) {
        config.rule = '30';
    }
    if (! ('scale' in config)) {
        config.scale = '10';
        config.updated = true;
    }
    if (! ('speed' in config) || [ 'high', 'middle', 'low' ].indexOf(config.speed) == -1) {
        config.speed = 'middle';
        config.updated = true;
    }
    if (config.updated) {
        delete config.updated;
        location.search = queryString.stringify(config);
    }
    const scale = parseInt(config.scale);
    const parseRule = (ruleStr: string): [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean] => {
        let ruleInt: number;
        if (ruleStr.match(/[01][01][01][01][01][01][01][01]/)) {
            ruleInt = parseInt(ruleStr, 2);
        } else {
            ruleInt = parseInt(ruleStr);
        }
        if (! (0 <= ruleInt && ruleInt < 256)) {
            ruleInt = Math.floor(Math.random() * 256);
        }
        return [
            !! (ruleInt & (1 << 0)),
            !! (ruleInt & (1 << 1)),
            !! (ruleInt & (1 << 2)),
            !! (ruleInt & (1 << 3)),
            !! (ruleInt & (1 << 4)),
            !! (ruleInt & (1 << 5)),
            !! (ruleInt & (1 << 6)),
            !! (ruleInt & (1 << 7)),
        ];
    };
    const randomRule = (config.rule.toLowerCase() == 'random');

    const body = document.body as HTMLBodyElement;
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const context = canvas.getContext('2d');
    const drawPixel = (y: number, x: number, color: string) => {
        context.fillStyle = color;
        context.fillRect(x * scale, y * scale, scale, scale);
    };

    const app = new ElementaryCellularAutomaton(parseRule(config.rule), drawPixel);
    const resize = () => {
        const h = body.clientHeight;
        const w = body.clientWidth;
        console.log('resize: H = ' + h + ', W = ' + w);
        canvas.height = h;
        canvas.width = w;
        context.fillStyle = 'black';
        context.fillRect(0, 0, canvas.width, canvas.height);
        app.resize(Math.floor(h / scale), Math.floor(w / scale));
    };
    const randomizeLine = (y: number) => {
        for (let x = 0; x < app.width; ++ x) {
            if (Math.random() < 0.3) {
                app.flipCell(y, x);
            }
        }
        app.setCurrentLine(y);
    };
    const click = (ev: MouseEvent) => {
        const y = Math.floor(ev.y / scale);
        const x = Math.floor(ev.x / scale);
        app.flipCell(y, x);
        app.setCurrentLine(y);
    };

    resize();
    randomizeLine(0);
    window.addEventListener('resize', (ev: any) => { resize(); });
    window.addEventListener('click', (ev: MouseEvent) => { click(ev); });
    setInterval(() => {
        if (randomRule && app.currentLine + 1 >= app.height) {
            app.rule = parseRule('random');
            randomizeLine(0);
        } else {
            app.step();
        }
    }, { 'high': 10, 'middle': 60, 'low': 600 }[config.speed]);
});
