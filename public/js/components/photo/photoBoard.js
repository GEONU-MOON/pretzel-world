// 사진 목록을 불러오는 함수 (목록 부분만 반환)
async function photoBoardContent() {
  let photoDataList = [];

  try {
    const response = await fetch(`/photos/all`);
    if (!response.ok) {
      throw new Error(`Failed to fetch photo data: ${response.status} ${response.statusText}`);
    }
    photoDataList = await response.json();
  } catch (error) {
    return `<div class="error">사진 데이터를 불러오는 데 실패했습니다.</div>`;
  }

  return photoDataList
    .map(photoData => {
      const commentsHtml = (photoData.comments || [])
        .map(
          (comment, idx) => `
          <div class="photo-comment-wrapper" id="comment-${photoData._id}-${idx}">
            <div class="photo-comment-info">
              <span>no.${idx + 1} ${comment.user_id}</span>
              <span id="photo-comment-writeAt">${new Date(comment.createdAt).toLocaleString()}</span>
            </div>
            <div class="photo-comment-content">
              <img src="${comment.profileImageUrl || '/resource/images/default-avatar.png'}" width="100" height="100" />
              <div>${comment.content}</div>
              <div class="photo-comment-edit-wrapper">
                <button onclick="editComment('${photoData._id}', ${idx})">수정</button>
                <button onclick="deleteComment('${photoData._id}', ${idx})">삭제</button>
              </div>
            </div>
          </div>`
        ).join("");

      return `
        <div class="photo-content-area" id="photo-${photoData._id}">
          <div class="photo-title">${photoData.title}</div>
          <div class="photo-info">
            <div class="photo-write-info">
              <div class="writer">${photoData.user_id}</div>
              <div class="date">${new Date(photoData.createdAt).toLocaleDateString()}</div>
            </div>
            <div class="photo-edit-wrapper">
              <button id="btn-photo-edit" onclick="editPhoto('${photoData._id}', '${photoData.title}', '${photoData.description}')">수정</button>
              <button id="btn-photo-remove" onclick="deletePhoto('${photoData._id}')">삭제</button>
            </div>
          </div>
          <div class="photo-gallery">
            <img src="${photoData.imageUrl}" class="photo-image">
            <div class="photo-content">
              <p>${photoData.description}</p>
            </div>
          </div>
          <div class="photo-comment-container">
            <form class="form-photo-comment" onsubmit="submitComment(event, '${photoData._id}')">
              <label>댓글</label>
              <input type="text" name="photo-comment" required />
              <button type="submit">확인</button>
            </form>
            ${commentsHtml}
          </div>
        </div>
      `;
    })
    .join("");
}

// 전체 사진 보드
async function photoBoard() {
  const photosHtml = await photoBoardContent();
  return `
    <div class="photo-board-container">
      <div class="photo-post"> 
        <button class="btn-photo-post" onclick="navigateTo('/photo/post')">사진 올리기</button>
      </div>
      <div class="photo-board-content-wrapper">
        ${photosHtml}
      </div>
    </div>
  `;
}

// 사진 수정 함수
function editPhoto(photoId, currentTitle, currentDescription) {
  const photoElement = document.querySelector(`#photo-${photoId}`);
  const titleElement = photoElement.querySelector(".photo-title");
  const descriptionElement = photoElement.querySelector(".photo-content p");

  // 제목과 설명을 수정 가능한 입력 폼으로 변경
  titleElement.innerHTML = `<input type="text" id="edit-photo-title" value="${currentTitle}">`;
  descriptionElement.innerHTML = `<textarea id="edit-photo-description">${currentDescription}</textarea>`;

  // 저장 및 취소 버튼으로 대체
  const editWrapper = photoElement.querySelector(".photo-edit-wrapper");
  editWrapper.innerHTML = `
    <button onclick="saveEditedPhoto('${photoId}')">저장</button>
    <button onclick="cancelEditPhoto('${photoId}', '${currentTitle}', '${currentDescription.replace(/'/g, "\\'")}')">취소</button>
  `;
}

// 사진 수정 내용 저장 함수
async function saveEditedPhoto(photoId) {
  const newTitle = document.querySelector("#edit-photo-title").value;
  const newDescription = document.querySelector("#edit-photo-description").value;

  const formData = new FormData();
  formData.append("title", newTitle);
  formData.append("description", newDescription);

  try {
    const response = await fetch(`/photos/${photoId}/edit`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify({ title: newTitle, description: newDescription })
    });

    if (response.ok) {
      alert("사진이 성공적으로 수정되었습니다!");

      // 제목과 설명을 업데이트하고 버튼을 원래대로 복원
      const photoElement = document.querySelector(`#photo-${photoId}`);
      photoElement.querySelector(".photo-title").innerHTML = newTitle;
      photoElement.querySelector(".photo-content p").innerHTML = newDescription.replace(/\n/g, "<br>");

      const editWrapper = photoElement.querySelector(".photo-edit-wrapper");
      editWrapper.innerHTML = `
        <button id="btn-photo-edit" onclick="editPhoto('${photoId}', '${newTitle}', '${newDescription.replace(/'/g, "\\'")}')">수정</button>
        <button id="btn-photo-remove" onclick="deletePhoto('${photoId}')">삭제</button>
      `;
    } else {
      const errorData = await response.json();
      alert(`사진 수정 실패: ${errorData.error}`);
    }
  } catch (error) {
    alert("사진 수정 중 오류가 발생했습니다. 다시 시도해 주세요.");
  }
}

// 사진 수정 취소 함수
function cancelEditPhoto(photoId, originalTitle, originalDescription) {
  const photoElement = document.querySelector(`#photo-${photoId}`);
  photoElement.querySelector(".photo-title").innerHTML = originalTitle;
  photoElement.querySelector(".photo-content p").innerHTML = originalDescription;

  const editWrapper = photoElement.querySelector(".photo-edit-wrapper");
  editWrapper.innerHTML = `
    <button id="btn-photo-edit" onclick="editPhoto('${photoId}', '${originalTitle}', '${originalDescription.replace(/'/g, "\\'")}')">수정</button>
    <button id="btn-photo-remove" onclick="deletePhoto('${photoId}')">삭제</button>
  `;
}

// 사진 삭제 함수
async function deletePhoto(photoId) {
  try {
    const response = await fetch(`/photos/${photoId}/delete`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });

    if (response.ok) {
      alert("사진이 성공적으로 삭제되었습니다!");
      const photoBoardContainer = document.querySelector(".photo-board-content-wrapper");
      photoBoardContainer.innerHTML = await photoBoardContent();
    } else {
      const errorData = await response.json();
      alert(`사진 삭제에 실패했습니다: ${errorData.error}`);
    }
  } catch {
    alert("사진 삭제에 실패했습니다.");
  }
}

// 댓글 추가 함수
async function submitComment(event, photoId) {
  event.preventDefault();
  const commentInput = event.target.querySelector("input[name='photo-comment']");
  const content = commentInput.value.trim();

  if (!content) {
    alert("댓글을 입력해 주세요.");
    return;
  }

  try {
    const response = await fetch(`/photos/${photoId}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify({ content }),
    });

    if (response.ok) {
      commentInput.value = "";
      document.querySelector(".photo-board-content-wrapper").innerHTML = await photoBoardContent();
    } else {
      const errorData = await response.json();
      alert(`댓글 작성 실패: ${errorData.error}`);
    }
  } catch {
    alert("댓글 작성 중 오류가 발생했습니다.");
  }
}

// 댓글 수정 함수
function editComment(photoId, commentIndex) {
  const commentElement = document.querySelector(`#comment-${photoId}-${commentIndex} .photo-comment-content div`);
  const originalContent = commentElement.textContent;
  commentElement.innerHTML = `<textarea id="edit-comment-content">${originalContent}</textarea>`;

  const editWrapper = commentElement.nextElementSibling;
  editWrapper.innerHTML = `
    <button onclick="saveEditedComment('${photoId}', ${commentIndex})">저장</button>
    <button onclick="cancelEditComment('${photoId}', ${commentIndex}, \`${originalContent}\`)">취소</button>
  `;
}

// 댓글 수정 저장 함수
async function saveEditedComment(photoId, commentIndex) {
  const newContent = document.querySelector("#edit-comment-content").value;

  try {
    const response = await fetch(`/photos/${photoId}/comment/${commentIndex}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify({ content: newContent }),
    });

    if (response.ok) {
      document.querySelector(".photo-board-content-wrapper").innerHTML = await photoBoardContent();
    } else {
      const errorData = await response.json();
      alert(`댓글 수정 실패: ${errorData.error}`);
    }
  } catch {
    alert("댓글 수정 중 오류가 발생했습니다.");
  }
}

// 댓글 수정 취소 함수
function cancelEditComment(photoId, commentIndex, originalContent) {
  const commentElement = document.querySelector(`#comment-${photoId}-${commentIndex} .photo-comment-content div`);
  commentElement.innerHTML = originalContent;

  const editWrapper = commentElement.nextElementSibling;
  editWrapper.innerHTML = `
    <button onclick="editComment('${photoId}', ${commentIndex})">수정</button>
    <button onclick="deleteComment('${photoId}', ${commentIndex})">삭제</button>
  `;
}

// 댓글 삭제 함수
async function deleteComment(photoId, commentIndex) {
  if (!confirm("이 댓글을 삭제하시겠습니까?")) return;

  try {
    const response = await fetch(`/photos/${photoId}/comment/${commentIndex}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });

    if (response.ok) {
      document.querySelector(".photo-board-content-wrapper").innerHTML = await photoBoardContent();
      alert("댓글이 성공적으로 삭제되었습니다.");
    } else {
      const errorData = await response.json();
      alert(`댓글 삭제 실패: ${errorData.error}`);
    }
  } catch {
    alert("댓글 삭제 중 오류가 발생했습니다.");
  }
}
