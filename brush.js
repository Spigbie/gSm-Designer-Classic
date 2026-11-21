class Brush {
    constructor({
        size = 10,
        opacity = 1,
        roundness = 1,
        softness = 1
    } ={}) {
        this.size = size;
        this.opacity = opacity;
        this.roundness = roundness;
        this.softness = softness;
    }

    setSize(size) {
        this.size = size;
    }

    setOpacity(opacity) {
        this.opacity = opacity;
    }

    setRoundess(roundness) {
        this.roundness = roundness;
    }

    setSize(softness) {
        this.softness = softness;
    }
}

const brush1 = new Brush(1, 1, 1, 0);