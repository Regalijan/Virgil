defmodule APIRouter.Responder do
  import Plug.Conn, only: [halt: 1, put_resp_content_type: 2, send_resp: 3]

  @spec respond(Plug.Conn, BSON.document()) :: Plug.Conn
  def respond(conn, doc) do
    {status, body} =
      cond do
        is_tuple(doc) -> {500, "{\"error\":\"Failed to perform action\"}"}
        is_nil(doc) or map_size(doc) === 0 -> {404, "{\"error\":\"Not found\"}"}
        true -> {200, Jason.encode!(doc)}
      end

    conn
    |> put_resp_content_type("application/json")
    |> send_resp(status, body)
    |> halt
  end
end
