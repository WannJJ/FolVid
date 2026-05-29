export const saveState = (state) => {
  localStorage.setItem("folvid_player_state", JSON.stringify(state));
};

export const loadState = () => {
  const raw = localStorage.getItem("folvid_player_state");
  return raw ? JSON.parse(raw) : null;
};
