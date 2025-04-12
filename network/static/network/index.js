document.addEventListener("DOMContentLoaded", function () {

    let followBtn = document.querySelector("#following-button");
    let new_post_form = document.querySelector("#new-post");
    let all_posts_page = document.querySelector("#posts-page");
    let profile_page = document.querySelector("#profile-page");
    if (profile_page) {
        document.querySelector("#profile-page").style.display = 'none'
    }
    if (all_posts_page) {
        document.querySelector("#all-posts").addEventListener("click", () => load_posts('all posts'))
    }
    if (followBtn) {
        followBtn.addEventListener("click", () => {
            document.querySelector("#new-post").style.display = 'none'
            load_posts('following')
        });
    }
    if (new_post_form) {
        document.querySelector("#new-post-form").addEventListener("submit", new_post)
    }
    if (all_posts_page) {
        load_posts('all posts')
    }
})

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = cookie.substring(name.length + 1);
                break;
            }
        }
    }
    return cookieValue;
}


function load_posts(posts, page = 1) {
    let heading;
    if (posts.includes("/")) {
        heading = `<h3 id="posts-heading">Profile Posts</h3>`;
    } else {
        heading = `<h3 id="posts-heading">${posts.replace(/\b\w/g, char => char.toUpperCase())}</h3>`;
    }

    fetch(`/posts/${posts}?page=${page}`)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            document.querySelector("#posts-page").innerHTML = heading
            for (let post of data.posts) {
                const post_div = document.createElement("div")
                post_div.className = "list-group-item"
                post_div.id = `post-${post.id}`;
                post_div.innerHTML = `
            <div id="post-user">
                <h6>${post.user.username}</h6>
            </div>
            <h5>${post.text}</h5>`;
                post_div.querySelector("#post-user h6").addEventListener("click", () => view_profile(post.user.id))



                // Check if the post belongs to the logged-in user
                if (post.user.username === data.current_user) {
                    const edit_button = document.createElement("button");
                    edit_button.innerText = "Edit";
                    edit_button.className = "btn btn-sm btn-primary";
                    edit_button.addEventListener("click", () => edit_post(post.id));
                    post_div.appendChild(edit_button);
                }
                const like_div = document.createElement("div");
                like_div.innerHTML = `
                    <div class="post-footer">
                    <span class="likes-count">Likes: ${post.likes_count}</span>
                    <p id="post-timestamp">${post.timestamp}</p>
                    </div>
                `;
                // Check if user is logged in, Like button
                if (data.current_user) {
                    like_div.innerHTML = `
                    <div class="post-footer">
                        <button id="like-btn-${post.id}" data-post-id="${post.id}">
                        <i class="fa${post.liked ? "s" : "r"} fa-thumbs-up"></i>
                        <span class="likes-count">${post.likes_count}</span>
                        </button>
                        <p id="post-timestamp">${post.timestamp}</p>
                    </div>
                        `;
                    like_div.querySelector(`#like-btn-${post.id}`).addEventListener("click", function () { like(post.id, this) })
                }
                post_div.appendChild(like_div);
                document.querySelector("#posts-page").appendChild(post_div)

            }
            // Pagination controls
            const pagination_div = document.createElement("div");
            pagination_div.id = "pagination-div"
            pagination_div.innerHTML = `
        ${data.has_previous ? `<button id="prev-btn">Previous</button>` : ""}
        ${data.has_next ? `<button id="next-btn">Next</button>` : ""}
        `;
            // Add event listeners for pagination
            document.querySelector("#posts-page").appendChild(pagination_div)
            if (data.has_previous) {
                pagination_div.querySelector("#prev-btn").addEventListener("click", () => load_posts(posts, data.page - 1));
            }
            if (data.has_next) {
                pagination_div.querySelector("#next-btn").addEventListener("click", () => load_posts(posts, data.page + 1));
            }
        });
}

function like(post_id, btn) {
    fetch(`post/${post_id}/like`)
        .then(response => response.json())
        .then(data => {
            console.log(data)
            let icon = btn.querySelector("i");
            icon.classList.toggle("fas", data.liked);
            icon.classList.toggle("far", !data.liked);
            btn.querySelector(".likes-count").textContent = data.likes_count;
        })
}


function edit_post(post_id) {
    console.log(post_id)
    fetch(`/post/${post_id}`)
        .then(response => response.json())
        .then(post => {
            console.log(post)
            const post_div = document.getElementById(`post-${post.id}`);
            post_div.innerHTML = `
            <div id="edit-content-container-${post.id}" class="edit-content-container">
            <textarea id="edit-content-${post.id}">${post.text}</textarea>
            <button id="save-btn-${post.id}" onclick="save_post(${post.id})">Save</button>
            </div>
        `;
        })
}

function save_post(post_id) {
    const new_content = document.querySelector(`#edit-content-${post_id}`).value;
    console.log(new_content)

    fetch(`/post/${post_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: new_content })
    })
        .then(response => response.json())
        .then(updated_post => {
            const post_div = document.getElementById(`post-${updated_post.id}`);
            post_div.innerHTML = `
            <div id="post-user">
                <h6>${updated_post.user.username}</h6>
            </div>
            <h5>${updated_post.text}</h5>
            <p id="post-timestamp">${updated_post.timestamp}</p>
            `;
            const edit_button = document.createElement("button");
            edit_button.innerText = "Edit";
            edit_button.className = "btn btn-sm btn-primary";
            edit_button.addEventListener("click", () => edit_post(updated_post.id));
            post_div.appendChild(edit_button);

        });
}


function view_profile(user_id) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    let profile_page = document.querySelector("#profile-page");
    let new_post_form = document.querySelector("#new-post");
    let posts_page = document.querySelector("#posts-page");
    let followers_following_page = document.querySelector("#followers-following");
    if (profile_page) {
        document.querySelector("#profile-page").style.display = 'block'
    }
    if (new_post_form) {
        document.querySelector("#new-post").style.display = 'none'
    }
    if (posts_page) {
        document.querySelector("#posts-page").style.display = 'block'
    }
    if (followers_following_page) {
        document.querySelector("#followers-following").style.display = 'none'
    }
    fetch(`/profile/${user_id}`)
        .then(response => response.json())
        .then(data => {
            console.log(data)
            follow_btn = document.createElement("button")
            follow_btn.id = "follow-unfollow-btn"
            follow_btn.textContent = data.is_following ? "Unfollow" : "Follow"
            follow_btn.addEventListener("click", () => follow(data.user.id))
            document.querySelector("#profile-username").innerHTML = `
            <h3>${data.user.username}</h3>
            `;
            document.querySelector("#follower-count").textContent = data.followers.count
            document.querySelector("#following-count").textContent = data.following.count
            document.querySelector("#likes-count").textContent = data.likes
            follower_div = document.querySelector("#profile-followers")
            following_div = document.querySelector("#profile-following")

            // follower_div.addEventListener("click", () => followers(data.user.id))
            // following_div.addEventListener("click", () => following(data.user.id))
            follower_div.onclick = () => followers(data.user.id);
            following_div.onclick = () => following(data.user.id);
            if (data.current_user && data.current_user != data.user.username) {
                document.querySelector("#follow-unfollow").innerHTML = ""
                document.querySelector("#follow-unfollow").appendChild(follow_btn)
            }

            load_posts(`profile posts/${data.user.id}`);
        })
}


function followers(user_id){
    let profile_posts = document.querySelector("#posts-page");
    let followers_following_page = document.querySelector("#followers-following");
    if (profile_posts) {
        document.querySelector("#posts-page").style.display = 'none'
    }
    if (followers_following_page) {
        document.querySelector("#followers-following").style.display = 'block'
    }

    fetch(`/followers/${user_id}`)
    .then(response => response.json())
    .then(data => {
        console.log(data, "followers called for", user_id)

        followers_page = document.getElementById("followers-following")
        followers_page.innerHTML=`<h3 id="posts-heading">Followers</h3>`

        for (let follower of data.followers){
            user_div = document.createElement("div")
            user_div.className = `follower-user-div`
            user_div.innerHTML = `
            <h3>${follower.follower.username}</h3>
            <h5>Followers: ${follower.followers_count}</h5>
            <h5>Following: ${follower.following_count}</h5>
            `;
            user_div.addEventListener("click", () => view_profile(follower.follower.id))
            if (followers_page){
                followers_page.appendChild(user_div)
            }
        }
    })
}


function following(user_id){
    let profile_posts = document.querySelector("#posts-page");
    let followers_following_page = document.querySelector("#followers-following");
    if (profile_posts) {
        document.querySelector("#posts-page").style.display = 'none'
    }
    if (followers_following_page) {
        document.querySelector("#followers-following").style.display = 'block'
    }
    fetch(`/following/${user_id}`)
    .then(response => response.json())
    .then(data => {
        console.log(data, "following called for ", user_id)

        following_page = document.getElementById("followers-following")
        following_page.innerHTML=`<h3 id="posts-heading">Following</h3>`

        for (let f of data.following){
            user_div = document.createElement("div")
            user_div.className = "follower-user-div"
            user_div.innerHTML = `
            <h3>${f.following.username}</h3>
            <h5>Followers: ${f.followers_count}</h5>
            <h5>Following: ${f.following_count}</h5>
            `;

            user_div.addEventListener("click", () => view_profile(f.following.id))
            if (following_page){
                following_page.appendChild(user_div)
            }
        }
    })
}

function follow(user_id) {
    console.log("Called Follow function")
    fetch(`/follow/${user_id}`)
        .then(response => response.json())
        .then(data => {
            console.log(data)
            follow_btn = document.querySelector("#follow-unfollow-btn")
            if (follow_btn) {
                if (data.followed === true) {
                    follow_btn.textContent = "Unfollow"
                }
                else {
                    follow_btn.textContent = "Follow"
                }
            }
        })
}

function new_post(event) {
    console.log("New post called")
    //event.preventDefault();
    const post_text = document.querySelector("#new-post-text").value.trim()
    if (!post_text) {
        alert("Post cannot be empty!");
        return;
    }

    fetch('/posts', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({
            text: post_text,
        })
    })
        .then(response => response.json())
        .then(result => {
            // Print result
            console.log(result);
        });
}