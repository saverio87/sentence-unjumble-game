

function createImage(src) {
    const img = document.createElement("img");
    img.src = src;
    img.classList.add("animate");
    img.addEventListener("animationend", () => {
        img.remove();
    });
    return img;
}

function createReusableImage(src) {
    const img = document.createElement("img");
    img.src = src;
    img.classList.add("animate");
    img.style.position = "absolute"; // Optional for positioning
    img.style.pointerEvents = "none"; // Prevent interaction
    img.style.width = 0;
    img.style.height = 0;
    img.style.opacity = 0;
    return img;
}


export function animateSentenceCompletion(topContainer) {
    return new Promise((resolve) => {
        const children = Array.from(topContainer.children);
        let completedAnimations = 0;

        children.forEach((box) => {
            const img = createImage('./tick.png');
            box.appendChild(img);

            img.addEventListener("animationend", () => {
                completedAnimations++;
                if (completedAnimations === children.length) {
                    resolve(); // Resolve the promise when all animations are done
                }
            });
        });
    });
}

export function triggerReusableImageAnimation(targetElement, imageType) {
    // Determine which image to use
    const image = imageType === 'tick' ? createReusableImage('./tick.png')
        : createReusableImage('./cross.png');
    // Append the reusable image to the target element
    targetElement.appendChild(image);
    // Reset the animation by removing and re-adding the class
    image.classList.remove("animate");
    void image.offsetWidth; // Trigger reflow to restart animation
    image.classList.add("animate");

    // Listen for the animationend event to remove the image
    image.addEventListener("animationend", () => {
        if (image.parentElement === targetElement) {
            targetElement.removeChild(image);
        }
    }, { once: true });
}


// Boxes Animations

// Animate when the player picks the right letter
export function disappearBox(bottomContainer, wordIndex) {

    return new Promise((resolve) => {
        const box = bottomContainer.children[wordIndex];
        box.classList.add("correct", "hidden");
        const onTransitionEnd = () => {
            box.removeEventListener('transitionend', onTransitionEnd);
            resolve("Box disappeared!");
        };
        box.addEventListener('transitionend', onTransitionEnd);

    });

}

export function appearBox(topContainer, nextEmptyIndex) {
    return new Promise((resolve) => {
        const box = topContainer.children[nextEmptyIndex];
        triggerReusableImageAnimation(box, 'tick');
        box.classList.remove("underscored");
        box.classList.add("normal", "appearing");
        const onAnimationEnd = () => {
            box.removeEventListener('animationend', onAnimationEnd);
            console.log("resolving appearBox");
            resolve();
        };
        box.addEventListener('animationend', onAnimationEnd);
    });
}

// Animate when the player picks the wrong letter
export function animateWrongWord(bottomContainer, wordIndex) {
    const box = bottomContainer.children[wordIndex];
    box.classList.add("wrong");
    triggerReusableImageAnimation(box, 'cross');
    setTimeout(() => {
        box.classList.remove("wrong");
    }, 500);
}