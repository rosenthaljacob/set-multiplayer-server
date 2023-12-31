import { RoomSettings } from "../../../../cache/roomCache";
import { verifyToken } from "../../../../auth/verifyToken";
import * as yup from "yup";
import { IOContext } from "../../../../types/context";
import { updateLobbyRooms } from "../../../emitters/lobby/emitToLobby";
import { gameEmitters } from "../../../emitters/game/gameEmitters";
import { io, roomCache } from "../../../../instances";

interface GetRoomsParams {
  token: string;
  room_name: string;
  game_type: "competitive" | "knockout";
  settings: RoomSettings;
}

const schema = yup.object().shape({
  token: yup.string().required(),
  room_name: yup.string().required(),
  game_type: yup.string().oneOf(["competitive", "knockout"]).required(),
  settings: yup.object().shape({
    remove_from_lobby_in_game: yup.boolean().required(),
  }),
});

import { updateGameRoom } from "../../../emitters/game/emitToGame";

export const createRoomHandler = async (
  context: IOContext,
  params: GetRoomsParams
) => {
  const { socket } = context;

  try {
    await schema.validate(params);
  } catch (error) {
    throw new Error(
      error instanceof yup.ValidationError ? error.message : "Invalid params"
    );
  }

  const { token, settings, room_name, game_type } = params;

  const user = verifyToken(token);

  if (!user) throw new Error("Invalid token");

  const roomId = roomCache.createRoom({
    gameType: game_type,
    roomName: room_name,
    settings,
    socket,
    user,
  });

  socket.join(roomId);
  io.to(roomId).emit("room-created", { roomId });

  gameEmitters.addedToGame({ room_id: roomId }, (...args) =>
    socket.emit(...args)
  );
  updateLobbyRooms();
  updateGameRoom(roomId);
};
