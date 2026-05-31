"""宠物右键上下文菜单 — 提供快捷操作入口"""
from PyQt5.QtWidgets import QMenu, QAction
from PyQt5.QtGui import QCursor

from lib.core.event.center import get_event_center, EventType, Event


class PetContextMenu(QMenu):
    """宠物右键上下文菜单，粉白主题配色"""

    def __init__(self, entity, parent=None):
        super().__init__(parent)
        self._entity = entity
        self._event_center = get_event_center()
        self._setup_menu()
        self._apply_style()

    def _setup_menu(self):
        # 命令输入
        cmd_action = QAction('⌨  命令输入', self)
        cmd_action.setToolTip('打开命令对话框')
        cmd_action.triggered.connect(self._on_command_toggle)
        self.addAction(cmd_action)

        # CMD 终端
        terminal_action = QAction('▸  CMD 终端', self)
        terminal_action.setToolTip('打开 CMD 终端窗口')
        terminal_action.triggered.connect(self._on_cmd_window)
        self.addAction(terminal_action)

        # 控制面板
        settings_action = QAction('⚙  控制面板', self)
        settings_action.setToolTip('打开 AI 设置面板')
        settings_action.triggered.connect(self._on_ai_settings)
        self.addAction(settings_action)

        self.addSeparator()

        # 清理桌面
        cleanup_action = QAction('✕  清理桌面', self)
        cleanup_action.setToolTip('清理桌面对象')
        cleanup_action.triggered.connect(self._on_cleanup_desktop)
        self.addAction(cleanup_action)

        # 清理缓存
        cache_action = QAction('↻  清理缓存', self)
        cache_action.setToolTip('清理运行时缓存')
        cache_action.triggered.connect(self._on_cleanup_cache)
        self.addAction(cache_action)

        self.addSeparator()

        # 退出程序
        quit_action = QAction('✕  退出程序', self)
        quit_action.setToolTip('退出桌宠程序')
        quit_action.triggered.connect(self._on_quit)
        self.addAction(quit_action)

    def _on_command_toggle(self):
        self._event_center.publish(Event(EventType.UI_COMMAND_TOGGLE, {
            'entity': self._entity,
        }))

    def _on_cmd_window(self):
        self._event_center.publish(Event(EventType.UI_OPEN_CMD_WINDOW, {
            'entity': None,
        }))

    def _on_ai_settings(self):
        try:
            from lib.script.ui.ai_settings_panel import AISettingsPanel
            panel = AISettingsPanel()
            panel.show_centered()
        except Exception:
            pass

    def _on_cleanup_desktop(self):
        self._event_center.publish(Event(EventType.INPUT_HASH, {
            'text': '清理',
        }))

    def _on_cleanup_cache(self):
        from pathlib import Path
        from config.config import CLOUD_MUSIC

        project_root = Path(__file__).resolve().parents[3]
        cache_root = project_root / str(CLOUD_MUSIC.get("cache_dir", "resc/user/temp") or "resc/user/temp")
        platform_names = ("netease", "qq", "kugou", "local", "other")
        platform_dirs = [cache_root / name for name in platform_names if (cache_root / name).is_dir()]

        deleted_files = 0
        deleted_bytes = 0
        for platform_dir in platform_dirs:
            for file_path in platform_dir.rglob('*'):
                if not file_path.is_file():
                    continue
                try:
                    file_size = file_path.stat().st_size
                except OSError:
                    file_size = 0
                try:
                    file_path.unlink()
                    deleted_files += 1
                    deleted_bytes += max(0, file_size)
                except OSError:
                    pass

        if deleted_files == 0:
            message = '现在很干净，无需清理缓存'
        else:
            cleaned_mb = deleted_bytes / (1024 * 1024)
            message = f'已清理 {cleaned_mb:.2f} MB 缓存'

        self._event_center.publish(Event(EventType.INFORMATION, {
            'text': message,
            'min': 0,
            'max': 60,
        }))

    def _on_quit(self):
        self._event_center.publish(Event(EventType.APP_QUIT, {
            'exit_code': 0,
        }))

    def _apply_style(self):
        self.setStyleSheet("""
            QMenu {
                background-color: #FFFFFF;
                border: 2px solid #FFB6C1;
                border-radius: 6px;
                padding: 4px;
                font-size: 13px;
                color: #50283C;
            }
            QMenu::item {
                padding: 6px 24px 6px 12px;
                border-radius: 4px;
                margin: 1px 4px;
            }
            QMenu::item:selected {
                background-color: #FFB6C1;
                color: #50283C;
            }
            QMenu::separator {
                height: 1px;
                background-color: #FFD2D8;
                margin: 4px 8px;
            }
        """)

    @classmethod
    def show_at_cursor(cls, entity):
        """在鼠标位置弹出上下文菜单"""
        menu = cls(entity)
        menu.exec_(QCursor.pos())