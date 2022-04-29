defmodule APIRouter do
  use Plug.Router
  use Plug.ErrorHandler

  plug(:match)
  plug(:dispatch)

  defp get_guild_settings(guild) do
    doc = Mongo.find_one(:mongo, "settings", %{guild: guild})
    data = Map.delete(doc, "_id")
    Jason.encode!(data)
  end

  get "/guild/:id" do
    conn = put_resp_content_type(conn, "application/json")
    token = String.replace(Dotenv.get("API_TOKEN"), ~r/\r|\n/, "")
    auth_header = get_req_header(conn, "authorization")

    {status, body} =
      if length(auth_header) > 0 && token == hd(auth_header) do
        {200, get_guild_settings(id)}
      else
        {401, "{\"error\":\"Unauthorized\"}"}
      end

    send_resp(conn, status, body)
  end

  match _ do
    conn = put_resp_content_type(conn, "application/json")
    send_resp(conn, 404, "{\"error\":\"Not found\"}")
  end

  @impl Plug.ErrorHandler
  def handle_errors(conn, %{kind: _kind, reason: _reason, stack: _stack}) do
    send_resp(conn, 500, "{\"error\":\"Internal server error\"}")
  end
end
