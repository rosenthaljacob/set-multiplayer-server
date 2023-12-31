import { verifyToken } from "../../../../auth/verifyToken";
import * as yup from "yup";
// Emitters
import { updateGameRoom } from "../../../emitters/game/emitToGame";
import { updateLobbyRooms } from "../../../emitters/lobby/emitToLobby";
import { gameEmitters } from "../../../emitters/game/gameEmitters";
// Constants
import { MAX_NUMBER_OF_PLAYERS_IN_ROOM } from "../../../../config/constants";
// Types
import { IOContext } from "../../../../types/context";
// Instances
import { roomCache } from "../../../../instances";

interface JoinRoomParams {
  token: string;
  roomId: string;
}

const joinRoomParamsSchema = yup.object().shape({
  token: yup.string().required(),
  roomId: yup.string().required(),
});

export const joinRoomHandler = async (
  context: IOContext,
  params: JoinRoomParams
) => {
  const { socket } = context;

  console.log("join-room", params);
  // Validation
  await joinRoomParamsSchema.validate(params);

  const room = roomCache.getRoomById(params.roomId);

  if (!room) {
    console.log("room not found", params.roomId);
    console.log(Array.from(roomCache.getAllRooms().values()));
  }
  if (!room) throw new Error("Room no longer exists.");

  if (room.room_players.size >= MAX_NUMBER_OF_PLAYERS_IN_ROOM)
    throw new Error("Room is full.");

  const user = verifyToken(params.token);

  if (!user) throw new Error("Invalid token.");

  const userInRoom = roomCache.getRoomIdByUser(user.user_id);

  if (userInRoom) throw new Error("You are already in a room.");

  // Add user to room or join requests
  if (room.game_status === "waiting-for-players") {
    roomCache.addToRoom(room.room_id, user, socket, "player");

    updateLobbyRooms();

    gameEmitters.addedToGame({ room_id: room.room_id }, (...args) =>
      socket.emit(...args)
    );
    socket.join(room.room_id);
  } else {
    roomCache.addToJoinRequests({ roomId: room.room_id, user, socket });
    gameEmitters.addedToJoinRequests({ room_id: room.room_id }, (...args) =>
      socket.emit(...args)
    );
  }

  updateGameRoom(room.room_id);
};
