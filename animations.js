

function createImage(src) {
    const img = document.createElement("img");
    img.src = src;
    img.classList.add('img');
    img.style.pointerEvents = "none"; // Prevent interaction
    return img;
}

export function createReusableImage(src) {
    const img = document.createElement("img");
    img.classList.add('img')
    img.src = src;
    img.style.position = "absolute"; // Optional for positioning
    img.style.pointerEvents = "none"; // Prevent interaction
    return img;
}

const tickImage = createReusableImage('./tick.png');
const crossImage = createReusableImage('./cross.png');


export function animateSentenceCompletion(topContainer) {
    return new Promise((resolve) => {
        const children = Array.from(topContainer.children);

        let completedAnimations = 0;
        // Animation
        children.forEach((box, _) => {
            const img = createImage('./tick.png');
            box.append(img);
            requestAnimationFrame(() => { // Introduce a delay
                img.classList.add("animate__animated", "animate__slideOutUp");
                img.addEventListener("animationend", function handleImageAnimation(event) {
                    completedAnimations++;
                    if (completedAnimations === children.length) {
                        resolve("animatewordcompletionresolved!");
                    }
                    img.removeEventListener("animationend", handleImageAnimation);
                    img.remove();
                });
            });

        })

    }, { once: true });



}

export function triggerReusableImageAnimation(targetElement, imageType) {
    return new Promise((resolve) => {
        // Determine which image to use
        const image = imageType === 'tick' ? tickImage : crossImage;
        // image.classList.add('img')
        // Append the reusable image to the target element
        targetElement.appendChild(image);
        // void image.offsetWidth; // Trigger reflow to restart animation
        image.classList.add("animate__animated", "animate__slideOutUp");
        // Listen for the animationend event to remove the image
        image.addEventListener("animationend", function handleImageAnimation(event) {
            image.classList.remove("animate__animated", "animate__slideOutUp");
            targetElement.removeChild(image);
            image.removeEventListener("animationend", handleImageAnimation);
            resolve("trigger reusable animation resolved")
        },
            // { once: true });
        )
    });


}


// Boxes Animations

// Animate when the player picks the right word
export function disappearBox(disappearingBox) {
    return new Promise((resolve) => {
        disappearingBox.classList.add("animate__animated", "animate__zoomOut");
        disappearingBox.classList.add("correct");
        // Wait for the transition to end
        disappearingBox.addEventListener("animationend", function handleAppearTransition(event) {
            disappearingBox.removeEventListener("animationend", handleAppearTransition);
            disappearingBox.classList.remove("animate__animated", "animate__zoomOut");
            disappearingBox.classList.add("hidden")
            resolve(""); // Resolve the promise when the transition ends
        });
    });

}

export function appearBox(appearingBox) {
    return new Promise((resolve) => {
        appearingBox.classList.remove("underscored");
        appearingBox.classList.add("normal", "correct");
        appearingBox.classList.add("animate__animated", "animate__zoomIn");
        // Wait for the transition to end
        appearingBox.addEventListener("animationend", function handleAppearTransition(event) {
            appearingBox.removeEventListener("animationend", handleAppearTransition);
            appearingBox.classList.remove("animate__animated", "animate__zoomIn");
            resolve("appearingboxresolved"); // Resolve the promise when the transition ends
        });

    });

}


// Animate when the player picks the wrong letter
export async function animateWrongWord(bottomContainer, wordIndex) {
    const box = bottomContainer.children[wordIndex];
    box.classList.add("wrong");
    await triggerReusableImageAnimation(box, 'cross');
    box.classList.remove("wrong");
}