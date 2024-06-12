"use strict";


const canv = document.querySelector("#canvas1");
const ctx = canv.getContext("2d");

canv.width = 600;
canv.height = 600;

// canvas settings
ctx.fillStyle = "white";
ctx.strokeStyle = "white";
ctx.lineWidth = 1;

class Particle
{
    constructor(effect)
    {
        this.effect = effect;
        this.x = Math.floor(Math.random() * this.effect.width);
        this.y = Math.floor(Math.random() * this.effect.height);
        this.speedX;
        this.speedY;
        this.speedModifier = Math.floor(Math.random() * 2 + 1)
        this.history = [{x: this.x, y:this.y}];
        this.maxLength = Math.floor(Math.random() * 60 + 10);
        this.angle = 0;
        this.newAngle = 0;
        this.angleCorrector = Math.random() * .5 + 0.01;
        this.timer = this.maxLength * 2;
        this.colors = ["#42014d", "#710582", "#b908d4", "#db84e8"];
        this.color = this.colors[Math.floor(Math.random()*this.colors.length)];
    }

    draw(context)
    {
        context.beginPath();
        context.moveTo(this.history[0].x, this.history[0].y);
        for(let i = 0; i < this.history.length; i++)
            {
                context.lineTo(this.history[i].x, this.history[i].y);
            }
        context.strokeStyle = this.color;
        context.stroke();
        context.closePath();
    }

    update()
    {
        this.timer--;
        if (this.timer >= 1)
            {
                let x = Math.floor(this.x / this.effect.cellSize);
                let y = Math.floor(this.y / this.effect.cellSize);
                let index = y * this.effect.cols + x;
                if (this.effect.flowField[index])
                    {
                        this.newAngle = this.effect.flowField[index].colorAngle;
                        if (this.angle > this.newAngle)
                            {
                                this.angle -= this.angleCorrector;
                            }
                        else if (this.angle < this.newAngle)
                            this.angle += this.angleCorrector;
                        else
                            this.angle = this.newAngle;
                    }
        
                this.speedX = Math.cos(this.angle);
                this.speedY = Math.sin(this.angle)
        
                this.x += this.speedX * this.speedModifier;
                this.y += this.speedY * this.speedModifier;
        
                this.history.push({x: this.x, y:this.y});
                if (this.history.length > this.maxLength)
                    this.history.shift();
            }
        else if (this.history.length > 1) {
            this.history.shift();
        }
        else
        {
            this.reset();
        }
    }
    reset()
    {
        let attempts = 0;
        let resetSuccess =false;

        while (!resetSuccess)
            {
                attempts++;
                let testIndex = Math.floor(Math.random()*this.effect.flowField.length);
                if (this.effect.flowField[testIndex].alpha > 0)
                    {
                        this.x =this.effect.flowField[testIndex].x;
                        this.y =this.effect.flowField[testIndex].y;
                        this.history = [{x: this.x, y:this.y}];
                        this.timer = this.maxLength * 2;
                        resetSuccess = true;
                    }
            }
        if (!resetSuccess)
            {
                this.x = Math.random() * this.effect.width;
                this.y = Math.random() * this.effect.height;
                this.history = [{x: this.x, y:this.y}];
                this.timer = this.maxLength * 2;
            }
    }
}

class Effect
{
    constructor(canvas, context)
    {
        this.canvas =canvas;
        this.ctx = context;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.particles = [];
        this.numberOfParticles = 2000;
        this.cellSize = 5;
        // this.cellSize = 5;
        this.rows;
        this.cols;
        this.flowField = [];
        this.curve = 5;
        this.zoom = .07;
        // this.curve = 1.02;
        // this.zoom = .08;
        this.#init();
    }

    drawText()
    {
        this.ctx.font = '400px Impact';
        this.ctx.textAlign = "center";
        this.ctx.textBaseline ="middle";

        this.ctx.fillStyle = "red";
        this.ctx.fillText("JS", this.width * .5, this.height * .5, this.width);
    }

    #init()
    {
        // create flow field
        this.rows = Math.floor(this.height / this.cellSize);
        this.cols = Math.floor(this.width / this.cellSize);
        this.flowField = [];

        // draw text
        this.drawText();
        

        // scan pixel data
        const pixels = this.ctx.getImageData(0,0, this.width, this.height).data;
        for(let y = 0; y < this.height; y+=this.cellSize)
            {
                for(let x = 0; x < this.width; x += this.cellSize)
                    {
                        const index = (y * this.width + x) * 4;
                        const red = pixels[index];
                        const green = pixels[index + 1];
                        const blue = pixels[index + 2];
                        const alpha = pixels[index + 3];
                        const grayscale = (red + blue + green) / 3;
                        
                        const colorAngle = ((grayscale/255)* 6.28).toFixed(1);

                        this.flowField.push({
                            x: x,
                            y: y,
                            alpha: alpha,
                            colorAngle: colorAngle
                        });
                    }
            }

        // for(let y = 0; y < this.rows; y++)
        //     {
        //         for(let x = 0; x < this.cols; x++)
        //             {
        //                 let angle = (Math.cos(x * this.zoom) * Math.sin(y * this.zoom)) + this.curve;
        //                 this.flowField.push(angle);
        //             }
        //     }
        // create Particle
        for(let i = 0; i < this.numberOfParticles; i++)
            {
                this.particles.push(new Particle(this));
            }
            this.particles.forEach((partic)=>{
                partic.reset();
            })
    }

    drawgrid()
    {
        this.ctx.strokeStyle = "white";
        for (let c = 0; c < this.cols; c++)
            {
                this.ctx.beginPath();
                this.ctx.moveTo(this.cellSize * c, 0);
                this.ctx.lineTo(this.cellSize* c, this.height);
                this.ctx.stroke();
            }
            for (let r = 0; r < this.rows; r++)
                {
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, this.cellSize * r);
                    this.ctx.lineTo(this.width ,this.cellSize* r);
                    this.ctx.stroke();
                }
    }
    render()
    {
        // this.drawgrid(ctx);
        this.drawText();
        // this.drawgrid();
        this.particles.forEach(particles =>
            {
                particles.draw(this.ctx);
                particles.update();
            }
        )
    }
}

const ef = new Effect(canv, ctx);

function animate()
{
    ctx.clearRect(0,0, canv.width,canv.height);
    ef.render();
    requestAnimationFrame(animate);
}

animate();
